'use server'
import { GoogleAuth, IdTokenClient } from 'google-auth-library'

let suchnavaliClient: IdTokenClient
let dhruvtaraClient: IdTokenClient
let auth: GoogleAuth

export async function getSuchnavaliClient(): Promise<IdTokenClient> {
    if (!suchnavaliClient) {
        if (!auth) {
            auth = new GoogleAuth()
        }
        suchnavaliClient = await auth.getIdTokenClient(process.env.SUCHNAVALI_BASE_URL!)
    }
    return suchnavaliClient
}

export async function getDhruvtaraClient(): Promise<IdTokenClient> {
    if (!dhruvtaraClient) {
        if (!auth) {
            auth = new GoogleAuth()
        }
        dhruvtaraClient = await auth.getIdTokenClient(process.env.DHRUV_TARA_URL!)
    }
    return dhruvtaraClient
}