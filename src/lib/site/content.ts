import type { AppLang } from "@/i18n/routes";

export type ExampleItem = {
    title: Record<AppLang, string>;
    image: string;
    alt: Record<AppLang, string>;
};

export type BlogPost = {
    slug: string;
    lang: AppLang;
    title: string;
    excerpt: string;
    publishedAt: string;
    cover: string;
    readMinutes: number;
    body: string[];
};

export const exampleGroups: Record<"home" | "photo" | "avatar" | "couple", ExampleItem[]> = {
    home: [
        { title: { en: "Pastel cat wizard", zh: "粉彩猫咪法师", ja: "パステル猫ウィザード", es: "Mago gato pastel", fr: "Magicien chat pastel" }, image: "/chibi-examples/avatar-1.png", alt: { en: "Pastel cat wizard chibi", zh: "粉彩猫咪法师 Q 版", ja: "パステル猫ウィザードのチビ", es: "Chibi de mago gato pastel", fr: "Chibi magicien chat pastel" } },
        { title: { en: "Cherry blossom duo", zh: "樱花双人", ja: "桜のペア", es: "Duo de sakura", fr: "Duo sakura" }, image: "/chibi-examples/couple-1.png", alt: { en: "Cherry blossom couple chibi", zh: "樱花情侣 Q 版", ja: "桜カップルのチビ", es: "Chibi de pareja entre cerezos", fr: "Chibi couple sakura" } },
        { title: { en: "Soft portrait remix", zh: "柔和人像重绘", ja: "やわらかポートレート", es: "Retrato suave", fr: "Portrait doux" }, image: "/chibi-examples/photo-to-chibi-1.png", alt: { en: "Photo to chibi portrait", zh: "照片转 Q 版人像", ja: "写真からチビのポートレート", es: "Retrato de foto a chibi", fr: "Portrait photo vers chibi" } },
        { title: { en: "Sticker-ready hero", zh: "贴纸风角色", ja: "ステッカー向けヒーロー", es: "Heroe para sticker", fr: "Hero pour sticker" }, image: "/chibi-examples/avatar-3.png", alt: { en: "Sticker style chibi hero", zh: "贴纸风 Q 版角色", ja: "ステッカースタイルのチビ", es: "Heroe chibi estilo sticker", fr: "Hero chibi style sticker" } },
    ],
    photo: [
        { title: { en: "Selfie to chibi", zh: "自拍转 Q 版", ja: "自撮りからチビ", es: "Selfie a chibi", fr: "Selfie en chibi" }, image: "/chibi-examples/photo-to-chibi-1.png", alt: { en: "Photo to chibi example 1", zh: "照片转 Q 版示例 1", ja: "写真からチビの例 1", es: "Ejemplo 1 de foto a chibi", fr: "Exemple photo vers chibi 1" } },
        { title: { en: "Fashion portrait", zh: "时尚人像", ja: "ファッションポートレート", es: "Retrato de moda", fr: "Portrait mode" }, image: "/chibi-examples/photo-to-chibi-2.png", alt: { en: "Photo to chibi example 2", zh: "照片转 Q 版示例 2", ja: "写真からチビの例 2", es: "Ejemplo 2 de foto a chibi", fr: "Exemple photo vers chibi 2" } },
        { title: { en: "Studio style", zh: "棚拍风格", ja: "スタジオ風", es: "Estilo estudio", fr: "Style studio" }, image: "/chibi-examples/photo-to-chibi-3.png", alt: { en: "Photo to chibi example 3", zh: "照片转 Q 版示例 3", ja: "写真からチビの例 3", es: "Ejemplo 3 de foto a chibi", fr: "Exemple photo vers chibi 3" } },
        { title: { en: "Warm smile", zh: "温暖笑容", ja: "やさしい笑顔", es: "Sonrisa calida", fr: "Sourire chaleureux" }, image: "/chibi-examples/photo-to-chibi-4.png", alt: { en: "Photo to chibi example 4", zh: "照片转 Q 版示例 4", ja: "写真からチビの例 4", es: "Ejemplo 4 de foto a chibi", fr: "Exemple photo vers chibi 4" } },
    ],
    avatar: [
        { title: { en: "Creator profile", zh: "创作者头像", ja: "クリエイタープロフィール", es: "Perfil de creador", fr: "Profil createur" }, image: "/chibi-examples/avatar-1.png", alt: { en: "Avatar example 1", zh: "头像示例 1", ja: "アバター例 1", es: "Ejemplo de avatar 1", fr: "Exemple avatar 1" } },
        { title: { en: "Streamer badge", zh: "主播徽章", ja: "配信者バッジ", es: "Insignia de streamer", fr: "Badge streamer" }, image: "/chibi-examples/avatar-2.png", alt: { en: "Avatar example 2", zh: "头像示例 2", ja: "アバター例 2", es: "Ejemplo de avatar 2", fr: "Exemple avatar 2" } },
        { title: { en: "Pastel gamer", zh: "粉彩玩家", ja: "パステルゲーマー", es: "Gamer pastel", fr: "Gamer pastel" }, image: "/chibi-examples/avatar-3.png", alt: { en: "Avatar example 3", zh: "头像示例 3", ja: "アバター例 3", es: "Ejemplo de avatar 3", fr: "Exemple avatar 3" } },
        { title: { en: "Minimal portrait", zh: "极简人像", ja: "ミニマルポートレート", es: "Retrato minimalista", fr: "Portrait minimal" }, image: "/chibi-examples/avatar-4.png", alt: { en: "Avatar example 4", zh: "头像示例 4", ja: "アバター例 4", es: "Ejemplo de avatar 4", fr: "Exemple avatar 4" } },
    ],
    couple: [
        { title: { en: "Matching hoodies", zh: "情侣连帽衫", ja: "おそろいパーカー", es: "Sudaderas a juego", fr: "Sweats assortis" }, image: "/chibi-examples/couple-1.png", alt: { en: "Couple example 1", zh: "情侣示例 1", ja: "カップル例 1", es: "Ejemplo de pareja 1", fr: "Exemple couple 1" } },
        { title: { en: "Festival date", zh: "节日约会", ja: "お祭りデート", es: "Cita de festival", fr: "Rendez-vous festival" }, image: "/chibi-examples/couple-2.png", alt: { en: "Couple example 2", zh: "情侣示例 2", ja: "カップル例 2", es: "Ejemplo de pareja 2", fr: "Exemple couple 2" } },
        { title: { en: "Anniversary art", zh: "纪念日插画", ja: "記念日アート", es: "Arte de aniversario", fr: "Illustration anniversaire" }, image: "/chibi-examples/couple-3.png", alt: { en: "Couple example 3", zh: "情侣示例 3", ja: "カップル例 3", es: "Ejemplo de pareja 3", fr: "Exemple couple 3" } },
        { title: { en: "Cafe scene", zh: "咖啡馆场景", ja: "カフェシーン", es: "Escena de cafe", fr: "Scene de cafe" }, image: "/chibi-examples/couple-4.png", alt: { en: "Couple example 4", zh: "情侣示例 4", ja: "カップル例 4", es: "Ejemplo de pareja 4", fr: "Exemple couple 4" } },
    ],
};

const posts: BlogPost[] = [
    {
        slug: "how-to-write-better-chibi-prompts",
        lang: "en",
        title: "How To Write Better Chibi Prompts",
        excerpt: "A practical framework for describing hair, outfit, mood, pose, and background so the generator returns cleaner chibi results.",
        publishedAt: "2026-05-10",
        cover: "/chibi-examples/avatar-2.png",
        readMinutes: 4,
        body: [
            "Strong chibi prompts are short but specific. Start with the subject, then add two or three visual anchors such as hairstyle, outfit, and emotion.",
            "If you want a profile-avatar result, say so directly. If you want a sticker look, call out bold outlines, simple backgrounds, and expressive poses.",
            "For photo-guided generations, use notes to preserve likeness rather than rewriting the entire scene. Mention what must stay recognizable and what can be stylized.",
        ],
    },
    {
        slug: "photo-to-chibi-best-practices",
        lang: "en",
        title: "Photo To Chibi Best Practices",
        excerpt: "What makes a source image easy to transform, and how to avoid weak results when uploading selfies or portraits.",
        publishedAt: "2026-05-12",
        cover: "/chibi-examples/photo-to-chibi-2.png",
        readMinutes: 3,
        body: [
            "Use a clear face shot with enough light and avoid heavy blur. The model needs visible facial structure, hair shape, and accessories to preserve likeness.",
            "Crowded backgrounds are acceptable, but simple framing performs better. A single subject nearly always works better than a group photo.",
            "When the output needs to feel more premium, choose the portrait style and add a short note describing mood or palette instead of overloading the prompt.",
        ],
    },
    {
        slug: "cute-avatar-ideas-for-social-profiles",
        lang: "en",
        title: "Cute Avatar Ideas For Social Profiles",
        excerpt: "Popular prompt themes for Discord, Twitch, TikTok, and personal branding.",
        publishedAt: "2026-05-15",
        cover: "/chibi-examples/avatar-4.png",
        readMinutes: 3,
        body: [
            "Social avatars work best when the silhouette is easy to recognize at small sizes. Oversized accessories and clear color contrast help a lot.",
            "Animal ears, headphones, magical props, and seasonal outfits are reliable ways to give the character personality without making the image noisy.",
            "If you want consistency across a team or brand, keep the same palette and background treatment while varying hair, outfit, and expression.",
        ],
    },
    {
        slug: "how-to-write-better-chibi-prompts",
        lang: "zh",
        title: "如何写出更好的 Q 版提示词",
        excerpt: "用更清晰的角色描述、服装线索和场景信息，让生成结果更稳定。",
        publishedAt: "2026-05-10",
        cover: "/chibi-examples/avatar-2.png",
        readMinutes: 4,
        body: [
            "好的提示词不需要很长，但一定要明确。先写主体，再补充发型、服装、表情和背景这几个关键点。",
            "如果你想做头像，就直接写头像；如果你想做贴纸，就说明粗线条、简单背景和夸张表情。",
            "上传照片时，备注重点放在保留哪些特征，而不是把整张图重新描述一遍。",
        ],
    },
    {
        slug: "photo-to-chibi-best-practices",
        lang: "zh",
        title: "照片转 Q 版的最佳实践",
        excerpt: "什么样的自拍或人像更容易转成可爱的 Q 版效果。",
        publishedAt: "2026-05-12",
        cover: "/chibi-examples/photo-to-chibi-2.png",
        readMinutes: 3,
        body: [
            "尽量使用光线清晰、主体明确的人像，模型才能更好保留五官和发型。",
            "背景复杂不是完全不能用，但简单画面更稳定，单人照片通常比合照效果好。",
            "如果你想让结果更精致，可以优先选择 Portrait Chibi 风格，再补一句情绪或配色要求。",
        ],
    },
    {
        slug: "cute-avatar-ideas-for-social-profiles",
        lang: "zh",
        title: "社交头像的 Q 版灵感",
        excerpt: "适合 Discord、直播平台和社交媒体的 Q 版头像方向。",
        publishedAt: "2026-05-15",
        cover: "/chibi-examples/avatar-4.png",
        readMinutes: 3,
        body: [
            "小尺寸头像首先要保证轮廓清晰，所以大配饰、明显色差和集中构图都很重要。",
            "猫耳、耳机、魔法道具、节日服装都是很稳定的头像元素。",
            "如果你要做品牌化的一组头像，统一配色和背景，再分别调整人物细节会更耐看。",
        ],
    },
    {
        slug: "how-to-write-better-chibi-prompts",
        lang: "ja",
        title: "チビ生成のための良いプロンプトの書き方",
        excerpt: "髪型、服装、感情、背景を短く整理して、安定した生成結果を得る方法。",
        publishedAt: "2026-05-10",
        cover: "/chibi-examples/avatar-2.png",
        readMinutes: 4,
        body: [
            "良いプロンプトは長さよりも具体性が重要です。主役を決めてから、髪型、服装、表情、背景を追加します。",
            "プロフィール画像が欲しいならその用途を書き、ステッカー向けなら太い線やシンプル背景を指定します。",
            "写真ベースの生成では、似せたい特徴を簡潔に残す方が結果が安定します。",
        ],
    },
    {
        slug: "photo-to-chibi-best-practices",
        lang: "ja",
        title: "写真からチビ化するときのコツ",
        excerpt: "自撮りやポートレートを使うときに押さえておきたいポイント。",
        publishedAt: "2026-05-12",
        cover: "/chibi-examples/photo-to-chibi-2.png",
        readMinutes: 3,
        body: [
            "顔がはっきり見える明るい写真が最適です。髪型やアクセサリーも見えていると似せやすくなります。",
            "背景はシンプルな方が安定しやすく、複数人より単独写真の方が結果が良くなりやすいです。",
            "より上品な仕上がりが欲しい場合は Portrait Chibi を選び、色味や雰囲気だけを追加で指示すると良いです。",
        ],
    },
    {
        slug: "cute-avatar-ideas-for-social-profiles",
        lang: "ja",
        title: "SNS向けチビアバターのアイデア",
        excerpt: "Discord や配信、SNS に向いた使いやすいアバター構成。",
        publishedAt: "2026-05-15",
        cover: "/chibi-examples/avatar-4.png",
        readMinutes: 3,
        body: [
            "小さく表示されても見分けやすいように、シルエットと配色の差を意識すると効果的です。",
            "動物の耳、ヘッドホン、季節の衣装、魔法小物は個性を出しやすい定番要素です。",
            "複数アバターをブランドとして並べる場合は、背景や色味だけ共通化するとまとまりが出ます。",
        ],
    },
    {
        slug: "how-to-write-better-chibi-prompts",
        lang: "es",
        title: "Como escribir mejores prompts chibi",
        excerpt: "Una estructura simple para describir pelo, ropa, expresion y fondo con mejores resultados.",
        publishedAt: "2026-05-10",
        cover: "/chibi-examples/avatar-2.png",
        readMinutes: 4,
        body: [
            "Un buen prompt no necesita ser largo, pero si concreto. Empieza por el personaje y luego agrega dos o tres detalles visuales clave.",
            "Si quieres un avatar para perfil, dilo directamente. Si buscas un estilo sticker, pide lineas marcadas y fondo simple.",
            "Cuando usas una foto, enfoca la nota en los rasgos que deben conservarse y no en reescribir toda la escena.",
        ],
    },
    {
        slug: "photo-to-chibi-best-practices",
        lang: "es",
        title: "Buenas practicas para foto a chibi",
        excerpt: "Que tipo de selfie o retrato funciona mejor al convertirlo en chibi.",
        publishedAt: "2026-05-12",
        cover: "/chibi-examples/photo-to-chibi-2.png",
        readMinutes: 3,
        body: [
            "Usa una foto clara, bien iluminada y con el rostro visible. Asi el modelo puede mantener mejor el parecido.",
            "Los fondos simples suelen dar resultados mas consistentes y una sola persona funciona mejor que una foto grupal.",
            "Si quieres un resultado mas refinado, elige Portrait Chibi y agrega una nota breve sobre color o ambiente.",
        ],
    },
    {
        slug: "cute-avatar-ideas-for-social-profiles",
        lang: "es",
        title: "Ideas de avatar chibi para redes sociales",
        excerpt: "Conceptos populares para Discord, Twitch y perfiles personales.",
        publishedAt: "2026-05-15",
        cover: "/chibi-examples/avatar-4.png",
        readMinutes: 3,
        body: [
            "Los mejores avatares se reconocen rapido incluso en tamaño pequeño, por eso la silueta y el contraste importan mucho.",
            "Orejas de animal, auriculares, accesorios magicos y ropa de temporada son recursos faciles para dar personalidad.",
            "Si quieres coherencia entre varios perfiles, mantén la misma paleta y cambia solo el personaje o la expresion.",
        ],
    },
    {
        slug: "how-to-write-better-chibi-prompts",
        lang: "fr",
        title: "Mieux ecrire ses prompts chibi",
        excerpt: "Une methode simple pour decrire coiffure, tenue, humeur et decor avec plus de regularite.",
        publishedAt: "2026-05-10",
        cover: "/chibi-examples/avatar-2.png",
        readMinutes: 4,
        body: [
            "Un bon prompt n'a pas besoin d'etre long, mais il doit etre precis. Commencez par le personnage puis ajoutez quelques repères visuels.",
            "Si vous voulez un avatar de profil, dites-le clairement. Pour un rendu sticker, demandez des contours plus nets et un fond simple.",
            "Avec une photo de reference, concentrez la note sur les traits a conserver plutot que sur toute la scene.",
        ],
    },
    {
        slug: "photo-to-chibi-best-practices",
        lang: "fr",
        title: "Les bonnes pratiques pour photo vers chibi",
        excerpt: "Quels portraits fonctionnent le mieux pour une transformation chibi propre.",
        publishedAt: "2026-05-12",
        cover: "/chibi-examples/photo-to-chibi-2.png",
        readMinutes: 3,
        body: [
            "Choisissez une photo claire, lumineuse et bien cadrée sur le visage. Les details visibles aident a garder la ressemblance.",
            "Un fond simple reste preferable et une photo d'une seule personne donne generalement un meilleur resultat.",
            "Pour un rendu plus premium, utilisez Portrait Chibi et ajoutez seulement une courte indication d'ambiance ou de couleur.",
        ],
    },
    {
        slug: "cute-avatar-ideas-for-social-profiles",
        lang: "fr",
        title: "Idees d'avatars chibi pour les reseaux",
        excerpt: "Des pistes efficaces pour Discord, Twitch et les profils sociaux.",
        publishedAt: "2026-05-15",
        cover: "/chibi-examples/avatar-4.png",
        readMinutes: 3,
        body: [
            "Un bon avatar reste lisible en petit format, donc la silhouette et le contraste comptent beaucoup.",
            "Oreilles d'animal, casque audio, accessoires fantasy et tenues saisonnieres sont des options fiables pour donner du caractere.",
            "Pour une serie coherent d'avatars, gardez la meme palette et le meme type de fond, puis faites varier les personnages.",
        ],
    },
];

export function getBlogPosts(lang: AppLang) {
    return posts
        .filter((post) => post.lang === lang)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(lang: AppLang, slug: string) {
    return posts.find((post) => post.lang === lang && post.slug === slug)
        ?? posts.find((post) => post.lang === "en" && post.slug === slug)
        ?? null;
}
