'use server'
import { GoogleAuth, IdTokenClient } from 'google-auth-library'

let client : IdTokenClient
let auth : GoogleAuth

export async function getClient() : Promise<IdTokenClient> {
    if (!client){
        const firebaseAdminCreds = process.env.FIREBASE_ADMIN_KEY
        
        if (firebaseAdminCreds){
            auth = new GoogleAuth({
                credentials : JSON.parse(firebaseAdminCreds)
              })
        } else{
            auth = new GoogleAuth()
        }
        client = await auth.getIdTokenClient(process.env.NEXT_PUBLIC_MAP_VISUALIZER_BASE_URL!)
    }
    return client;
}