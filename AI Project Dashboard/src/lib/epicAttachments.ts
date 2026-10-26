const DATABASE = 'margin-epic-assets'
const STORE = 'images'
let database: Promise<IDBDatabase> | null = null

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('Image attachments are not supported by this browser.'))
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local image storage.'))
  })
  return database
}

export async function saveEpicAsset(id: string, file: File) {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(file, id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not save the image.'))
  })
}

export async function loadEpicAsset(id: string) {
  const db = await openDatabase()
  return new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not load the image.'))
  })
}

export async function deleteEpicAsset(id: string) {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not remove the image.'))
  })
}

export const saveEpicImage = saveEpicAsset
export const loadEpicImage = loadEpicAsset
export const deleteEpicImage = deleteEpicAsset
