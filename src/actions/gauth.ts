'use server'
import { GoogleAuth, IdTokenClient } from 'google-auth-library'
let client: IdTokenClient
let auth: GoogleAuth
export async function getClient(): Promise<IdTokenClient> {
    if (!client) {
        auth = new GoogleAuth()
        client = await auth.getIdTokenClient('https://suchnavali-vslywuxv3a-el.a.run.app')
    }
    return client
}