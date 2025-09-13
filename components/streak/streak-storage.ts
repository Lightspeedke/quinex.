// IndexedDB wrapper for persistent streak storage
class StreakStorage {
  private dbName = "StreakDB"
  private version = 1
  private storeName = "streaks"

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "userAddress" })
          store.createIndex("lastUpdated", "lastUpdated", { unique: false })
        }
      }
    })
  }

  async saveStreak(userAddress: string, streakData: any): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)

      const dataToStore = {
        userAddress,
        ...streakData,
        lastUpdated: Date.now(),
        backupHash: this.generateBackupHash(streakData),
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(dataToStore)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Also save to localStorage as fallback
      localStorage.setItem(`streak_data_${userAddress}`, JSON.stringify(streakData))

      db.close()
    } catch (error) {
      console.error("Error saving to IndexedDB, falling back to localStorage:", error)
      localStorage.setItem(`streak_data_${userAddress}`, JSON.stringify(streakData))
    }
  }

  async loadStreak(userAddress: string): Promise<any | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)

      const data = await new Promise<any>((resolve, reject) => {
        const request = store.get(userAddress)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      db.close()

      if (data) {
        // Verify data integrity
        const expectedHash = this.generateBackupHash(data)
        if (data.backupHash === expectedHash) {
          return data
        } else {
          console.warn("Streak data integrity check failed, trying localStorage")
        }
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(`streak_data_${userAddress}`)
      return localData ? JSON.parse(localData) : null
    } catch (error) {
      console.error("Error loading from IndexedDB, falling back to localStorage:", error)
      const localData = localStorage.getItem(`streak_data_${userAddress}`)
      return localData ? JSON.parse(localData) : null
    }
  }

  async exportBackup(userAddress: string): Promise<string> {
    const data = await this.loadStreak(userAddress)
    if (!data) throw new Error("No streak data found")

    const backup = {
      userAddress,
      data,
      timestamp: Date.now(),
      version: "1.0",
    }

    return btoa(JSON.stringify(backup))
  }

  async importBackup(backupString: string): Promise<{ userAddress: string; success: boolean }> {
    try {
      const backup = JSON.parse(atob(backupString))

      if (!backup.userAddress || !backup.data) {
        throw new Error("Invalid backup format")
      }

      await this.saveStreak(backup.userAddress, backup.data)

      return { userAddress: backup.userAddress, success: true }
    } catch (error) {
      console.error("Error importing backup:", error)
      return { userAddress: "", success: false }
    }
  }

  private generateBackupHash(data: any): string {
    // Simple hash for data integrity
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      db.close()
    } catch (error) {
      console.error("Error clearing IndexedDB:", error)
    }
  }
}

export const streakStorage = new StreakStorage()
