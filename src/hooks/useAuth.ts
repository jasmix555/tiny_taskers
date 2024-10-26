import {useEffect, useState} from "react";
import {onAuthStateChanged, User} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";

import {auth, db} from "../api/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(false);
  const [hasChildInfo, setHasChildInfo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();

          setHasUsername(!!userData.username);

          setHasChildInfo(!!userData.children && userData.children.length > 0);
        }
      } else {
        setUser(null); // Reset user state if not logged in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {user, loading, hasUsername, hasChildInfo};
}
