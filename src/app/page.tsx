"use client";

import { useEffect, useState } from 'react';
import { app, auth, GoogleAuthProvider, signInWithPopup, firestore, doc, getDoc, setDoc } from '../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { findWareHouseLocation } from './actions/actions';

interface Warehouse {
  // Latitude: number,
  // Longitute: number,
  // Warehouse: string
  Schedule: string,
  WH: string,
  distance: number,
  district: string,
  latitude: number,
  longitute: number,
  pincode: number,
  schedule_type: string,
  state: string
}


export default function Home() {


//   const [post, setPost] = useState("hello");
//   const [data, setData] = useState<Warehouse[]>([]);
//   const getName = async () => {
//     try {
//       const res = await fetch(
//         'http://localhost:3000/india_pincodes.geojson',
//         {
//           method: 'GET',
//         }
//       );

//       if (res) {
//         const p = await res.json()
//         function filterGeoJsonForState(geoJsonData: any): any {
//           // Filter the features where state is "NCT of Delhi"
//           const filteredFeatures = geoJsonData.features.filter((feature: any) =>
//             feature.properties.pincode === "210208"
//             // feature.properties.state === "Nct Of Delhi" || feature.properties.state === "Haryana" || feature.properties.state === "Uttar Pradesh"
//           );

//           return {
//             type: "FeatureCollection",
//             features: filteredFeatures,
//           };
//         }

//         const maxItems = 1024; // Show only the first 10 items for now
//         const truncatedData = {
//           ...filterGeoJsonForState(p),
//           features: filterGeoJsonForState(p).features.slice(0, 2048),
//         };
//         setPost(truncatedData);
//         console.log(filterGeoJsonForState(p));
//         // setPost(filterGeoJsonForState(p));
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const fetchWarehouseData = async () => {
//     try {
//         const response = await findWareHouseLocation();
//         // const whMap: WhMap = {};
//         // response.forEach(item => {
//         //     const warehouse = item.WH;
//         //     if (!whMap[warehouse]) {
//         //         whMap[warehouse] = [];
//         //     }
//         //     whMap[warehouse].push(item);
//         // });
//         // setWhMap(whMap);
//         const pincodes = response.map(location => location.pincode);
//         setData(response);

//     } catch (error) {
//         console.error('Error fetching warehouse data:', error);
//     }
// };

//   useEffect(() => {
//     getName();
//     fetchWarehouseData();

    
//     const filteredData = data.filter(item => pincodes.includes(item[1]));
//   })

//   // console.log("object", data);

//   return (
//     <div>
//       {/* <h1>GeoJSON Data</h1> */}
//       <pre>{JSON.stringify(post, null, 2)}</pre>
//     </div>
//   );


  const router = useRouter();
  const [User, setUser] = useState();

  const handleGoogleSignIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      // if (!userDoc.exists()) {
      //   await setDoc(userRef, {
      //     email: user.email,
      //     name: user.displayName,
      //     roles: ['user'],
      //   });
      // }
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // setUser(user)  
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router, User]);

  return (
    <div className="flex justify-center items-center h-screen bg-slate-900">
      <button
        onClick={handleGoogleSignIn}
        className="bg-blue-500 text-white px-16 py-6 text-2xl rounded-lg"
      >
        Sign in with Google
      </button>
    </div>
  );


}





// "use client";

// import { useEffect, useState } from "react";
// import {
//   auth,
//   GoogleAuthProvider,
//   signInWithPopup,
//   firestore,
//   doc,
//   getDoc,
//   setDoc,
// } from "../lib/firebaseConfig";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const router = useRouter();
//   const [loading, setLoading] = useState<boolean>(false);

//   const handleGoogleSignIn = async () => {
//     const provider = new GoogleAuthProvider();
//     try {
//       // Start Google sign-in
//       setLoading(true);
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;
//       console.log("object ", user.uid);

//       // Reference to user data in Firestore
//       const userRef = doc(firestore, "users", user.uid);
//       const userDoc = await getDoc(userRef);

//       // If the user doesn't exist in Firestore, create a new entry
//       if (!userDoc.exists()) {
//         await setDoc(userRef, {
//           email: user.email,
//           name: user.displayName,
//           roles: ["user"], // Assign default role
//         });
//       }

//       // Check if the user has necessary roles
//       const userRoles = userDoc.exists() ? userDoc.data()?.roles : ["user"];
//       if (userRoles.includes("user")) {
//         router.push("/dashboard");
//       } else {
//         await auth.signOut();
//         alert("You do not have the required role to access this application.");
//       }
//     } catch (error: any) {
//       console.error("Error signing in with Google:", error.message);
//       alert("Error signing in.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         const userRef = doc(firestore, "users", user.uid);
//         getDoc(userRef).then((userDoc) => {
//           if (userDoc.exists()) {
//             const userRoles = userDoc.data()?.roles;
//             if (userRoles && userRoles.includes("user")) {
//               router.push("/dashboard");
//             } else {
//               auth.signOut();
//               alert("You do not have the required role to access this application.");
//             }
//           }
//         });
//       }
//     });

//     return () => unsubscribe();
//   }, [router]);

//   return (
//     <div className="flex justify-center items-center h-screen">
//       <button
//         onClick={handleGoogleSignIn}
//         className="bg-blue-500 text-white p-4 rounded-lg"
//         disabled={loading}
//       >
//         {loading ? "Signing in..." : "Sign in with Google"}
//       </button>
//     </div>
//   );
// }
