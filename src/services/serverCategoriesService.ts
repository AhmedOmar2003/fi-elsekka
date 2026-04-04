import { createClient } from "@supabase/supabase-js";

export interface ServerCategory {
    id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getServerSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL and anon key are required.");
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export async function fetchCategoriesServer(): Promise<ServerCategory[]> {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, parent_id, created_at, updated_at")
        .order("name");

    if (error) {
        console.error("Error fetching categories on server:", error);
        return [];
    }

    return data || [];
}
