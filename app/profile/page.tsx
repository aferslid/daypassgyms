"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [contributions, setContributions] = useState(0);

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