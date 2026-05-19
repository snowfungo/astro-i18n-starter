import { all, get, run } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";

export type UserRecord = {
    id: number;
    google_id: string | null;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: string;
    is_mock_user: number;
    created_at: string;
};

export async function getUserById(userId: number) {
    return await get<UserRecord>(
        `SELECT id, google_id, email, name, avatar_url, role, is_mock_user, created_at
         FROM users WHERE id = $1`,
        [userId],
    );
}

export async function getUserByEmail(email: string) {
    return await get<UserRecord>(
        `SELECT id, google_id, email, name, avatar_url, role, is_mock_user, created_at
         FROM users WHERE email = $1`,
        [email],
    );
}

export async function getUserByGoogleId(googleId: string) {
    return await get<UserRecord>(
        `SELECT id, google_id, email, name, avatar_url, role, is_mock_user, created_at
         FROM users WHERE google_id = $1`,
        [googleId],
    );
}

export async function listUsers() {
    return await all<UserRecord>(
        `SELECT id, google_id, email, name, avatar_url, role, is_mock_user, created_at
         FROM users ORDER BY created_at DESC`,
    );
}

export async function upsertGoogleUser(input: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string;
    role?: string;
}) {
    const existing = (await getUserByGoogleId(input.googleId)) ?? (await getUserByEmail(input.email));
    if (existing) {
        await run(
            `UPDATE users SET google_id = $1, email = $2, name = $3, avatar_url = $4, role = $5 WHERE id = $6`,
            [
                input.googleId,
                input.email,
                input.name,
                input.avatarUrl,
                input.role ?? existing.role ?? "user",
                existing.id,
            ],
        );
        return (await getUserById(existing.id))!;
    }

    const result = await run(
        `INSERT INTO users (google_id, email, name, avatar_url, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
            input.googleId,
            input.email,
            input.name,
            input.avatarUrl,
            input.role ?? "user",
            nowIso(),
        ],
    );

    const userId = Number(result.lastInsertRowid);
    return (await getUserById(userId))!;
}

export async function ensureMockUser(input: {
    email: string;
    name: string;
    avatarUrl?: string;
    role?: string;
}) {
    const existing = await getUserByEmail(input.email);
    const avatarUrl =
        input.avatarUrl ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&background=4a90d9&color=fff`;

    if (existing) {
        await run(
            `UPDATE users SET name = $1, avatar_url = $2, role = $3, is_mock_user = 1 WHERE id = $4`,
            [input.name, avatarUrl, input.role ?? existing.role ?? "user", existing.id],
        );
        return (await getUserById(existing.id))!;
    }

    const result = await run(
        `INSERT INTO users (google_id, email, name, avatar_url, role, is_mock_user, created_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6)
         RETURNING id`,
        [
            `mock_${input.email.replace(/@/g, "_at_")}`,
            input.email,
            input.name,
            avatarUrl,
            input.role ?? "user",
            nowIso(),
        ],
    );
    return (await getUserById(Number(result.lastInsertRowid)))!;
}

export async function deleteUserById(userId: number) {
    await run(`DELETE FROM users WHERE id = $1`, [userId]);
}
