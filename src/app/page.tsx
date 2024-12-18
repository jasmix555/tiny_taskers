// app/page.tsx
"use client";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";

import {useAuth, useFetchChildren} from "@/hooks";
import {Child} from "@/types/ChildProps";
import {ChildListPopup, Loading} from "@/components";

export default function HomePage() {
  const {user, loading: authLoading} = useAuth();
  const {children, loading: childrenLoading} = useFetchChildren(user?.uid || "");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showListPopup, setShowListPopup] = useState(false);
  const router = useRouter();

  // Redirect to welcome page if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/welcome");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const savedChildId = localStorage.getItem("selectedChildId");

    if (children.length > 0) {
      if (savedChildId) {
        const savedChild = children.find((child) => child.id === savedChildId);

        if (savedChild) {
          setSelectedChild(savedChild);

          return;
        }
      }
      setSelectedChild(children[0]);
    }
  }, [children]);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    localStorage.setItem("selectedChildId", child.id);
    setShowListPopup(false);
  };

  const handleRegisterChild = () => {
    router.push("/child-registration");
  };

  if (authLoading || childrenLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-md p-4">
      {/* if no children registered add button to register child and show no child registered */}
      {children.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-center text-2xl font-bold">No child registered</h1>
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md"
            onClick={handleRegisterChild}
          >
            Register Child
          </button>
        </div>
      )}

      {children.length > 0 && selectedChild && (
        <button
          className="flex w-full cursor-pointer items-center gap-4 rounded-lg bg-white p-4 shadow-md"
          onClick={() => setShowListPopup(true)}
        >
          <div className="h-14 w-14 overflow-hidden rounded-full">
            <Image
              priority
              alt={selectedChild.name}
              className="rounded-full"
              height={200}
              src={selectedChild.picture || "/default-child.png"}
              width={200}
            />
          </div>
          <h2 className="text-xl font-bold">{selectedChild.name}</h2>
          <p className="ml-auto">{selectedChild.points}pt</p>
        </button>
      )}
      {showListPopup && (
        <ChildListPopup
          childrenList={children}
          selectedChildId={selectedChild?.id || ""}
          onClose={() => setShowListPopup(false)}
          onRegister={handleRegisterChild}
          onSelect={handleSelectChild}
        />
      )}
    </div>
  );
}
