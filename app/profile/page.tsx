"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [contributions, setContributions] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) return;

      const { count } = await supabase
        .from("spots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setContributions(count || 0);
    };

    fetchUser();
  }, []);

  return (
    <div className="p-6">
        
      <button
        onClick={() => router.push("/")}
        className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
        >
        ← Back to map
      </button>

      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <div className="bg-white rounded-2xl shadow p-4">
        <p className="mb-2">
          <strong>User:</strong> {user?.email}
        </p>

        <p>
          <strong>Contributions:</strong> {contributions}
        </p>
      </div>
    </div>
  );
}