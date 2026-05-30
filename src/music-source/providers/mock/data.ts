import type { Song } from "@/types";
import type { Playlist } from "@/types";
import type { Artist, Album } from "@/types";

// ==================== Mock Songs (52首) ====================

export const mockSongs: Song[] = [
  // --- 华语流行 (audio resolved at runtime via registered providers) ---
  { id: "s001", title: "七里香", artist: "周杰伦", album: "七里香", cover_url: "/icons/icon-192.png", audio_url: "", duration: 299, genre: "华语流行", release_year: 2004, play_count: 9800000, created_at: "2024-01-01" },
  { id: "s002", title: "晴天", artist: "周杰伦", album: "叶惠美", cover_url: "/icons/icon-192.png", audio_url: "", duration: 269, genre: "华语流行", release_year: 2003, play_count: 12000000, created_at: "2024-01-01" },
  { id: "s003", title: "稻香", artist: "周杰伦", album: "魔杰座", cover_url: "/icons/icon-192.png", audio_url: "", duration: 223, genre: "华语流行", release_year: 2008, play_count: 8500000, created_at: "2024-01-01" },
  { id: "s004", title: "夜曲", artist: "周杰伦", album: "十一月的肖邦", cover_url: "/icons/icon-192.png", audio_url: "", duration: 226, genre: "华语流行", release_year: 2005, play_count: 7600000, created_at: "2024-01-01" },
  { id: "s005", title: "光年之外", artist: "邓紫棋", album: "光年之外", cover_url: "/icons/icon-192.png", audio_url: "", duration: 235, genre: "华语流行", release_year: 2016, play_count: 15000000, created_at: "2024-01-01" },
  { id: "s006", title: "泡沫", artist: "邓紫棋", album: "Xposed", cover_url: "/icons/icon-192.png", audio_url: "", duration: 253, genre: "华语流行", release_year: 2012, play_count: 9200000, created_at: "2024-01-01" },
  { id: "s007", title: "演员", artist: "薛之谦", album: "绅士", cover_url: "/icons/icon-192.png", audio_url: "", duration: 261, genre: "华语流行", release_year: 2015, play_count: 11000000, created_at: "2024-01-01" },
  { id: "s008", title: "丑八怪", artist: "薛之谦", album: "意外", cover_url: "/icons/icon-192.png", audio_url: "", duration: 249, genre: "华语流行", release_year: 2013, play_count: 7800000, created_at: "2024-01-01" },
  { id: "s009", title: "起风了", artist: "买辣椒也用券", album: "起风了", cover_url: "/icons/icon-192.png", audio_url: "", duration: 313, genre: "华语流行", release_year: 2017, play_count: 20000000, created_at: "2024-01-01" },
  { id: "s010", title: "年少有为", artist: "李荣浩", album: "耳朵", cover_url: "/icons/icon-192.png", audio_url: "", duration: 289, genre: "华语流行", release_year: 2018, play_count: 6500000, created_at: "2024-01-01" },
  { id: "s011", title: "麻雀", artist: "李荣浩", album: "麻雀", cover_url: "/icons/icon-192.png", audio_url: "", duration: 251, genre: "华语流行", release_year: 2019, play_count: 5400000, created_at: "2024-01-01" },
  { id: "s012", title: "后来", artist: "刘若英", album: "年华", cover_url: "/icons/icon-192.png", audio_url: "", duration: 295, genre: "华语流行", release_year: 2000, play_count: 8800000, created_at: "2024-01-01" },
  { id: "s013", title: "十年", artist: "陈奕迅", album: "黑白灰", cover_url: "/icons/icon-192.png", audio_url: "", duration: 207, genre: "华语流行", release_year: 2003, play_count: 9500000, created_at: "2024-01-01" },
  { id: "s014", title: "孤勇者", artist: "陈奕迅", album: "孤勇者", cover_url: "/icons/icon-192.png", audio_url: "", duration: 247, genre: "华语流行", release_year: 2021, play_count: 25000000, created_at: "2024-01-01" },
  { id: "s015", title: "平凡之路", artist: "朴树", album: "平凡之路", cover_url: "/icons/icon-192.png", audio_url: "", duration: 312, genre: "华语流行", release_year: 2014, play_count: 13000000, created_at: "2024-01-01" },

  // --- 华语民谣/独立 ---
  { id: "s016", title: "成都", artist: "赵雷", album: "成都", cover_url: "/icons/icon-192.png", audio_url: "", duration: 327, genre: "民谣", release_year: 2016, play_count: 16000000, created_at: "2024-01-01" },
  { id: "s017", title: "南山南", artist: "马頔", album: "孤岛", cover_url: "/icons/icon-192.png", audio_url: "", duration: 265, genre: "民谣", release_year: 2014, play_count: 7200000, created_at: "2024-01-01" },
  { id: "s018", title: "理想三旬", artist: "陈鸿宇", album: "一如年少模样", cover_url: "/icons/icon-192.png", audio_url: "", duration: 251, genre: "民谣", release_year: 2016, play_count: 4800000, created_at: "2024-01-01" },
  { id: "s019", title: "借我", artist: "谢春花", album: "算云烟", cover_url: "/icons/icon-192.png", audio_url: "", duration: 248, genre: "民谣", release_year: 2016, play_count: 3500000, created_at: "2024-01-01" },

  // --- 华语 R&B / Hip-Hop ---
  { id: "s020", title: "别怕变老", artist: "刘柏辛", album: "2029", cover_url: "/icons/icon-192.png", audio_url: "", duration: 223, genre: "R&B", release_year: 2018, play_count: 2800000, created_at: "2024-01-01" },
  { id: "s021", title: "经济舱", artist: "刘聪", album: "经济舱", cover_url: "/icons/icon-192.png", audio_url: "", duration: 215, genre: "Hip-Hop", release_year: 2020, play_count: 5200000, created_at: "2024-01-01" },
  { id: "s022", title: "星球坠落", artist: "艾热", album: "星球坠落", cover_url: "/icons/icon-192.png", audio_url: "", duration: 237, genre: "Hip-Hop", release_year: 2018, play_count: 4100000, created_at: "2024-01-01" },

  // --- 粤语 ---
  { id: "s023", title: "海阔天空", artist: "Beyond", album: "乐与怒", cover_url: "/icons/icon-192.png", audio_url: "", duration: 326, genre: "摇滚", release_year: 1993, play_count: 18000000, created_at: "2024-01-01" },
  { id: "s024", title: "光辉岁月", artist: "Beyond", album: "命运派对", cover_url: "/icons/icon-192.png", audio_url: "", duration: 301, genre: "摇滚", release_year: 1990, play_count: 14000000, created_at: "2024-01-01" },
  { id: "s025", title: "富士山下", artist: "陈奕迅", album: "What's Going On...?", cover_url: "/icons/icon-192.png", audio_url: "", duration: 255, genre: "粤语流行", release_year: 2006, play_count: 8200000, created_at: "2024-01-01" },

  // --- 英文流行 ---
  { id: "s026", title: "Shape of You", artist: "Ed Sheeran", album: "÷", cover_url: "/icons/icon-192.png", audio_url: "", duration: 234, genre: "Pop", release_year: 2017, play_count: 35000000, created_at: "2024-01-01" },
  { id: "s027", title: "Perfect", artist: "Ed Sheeran", album: "÷", cover_url: "/icons/icon-192.png", audio_url: "", duration: 263, genre: "Pop", release_year: 2017, play_count: 28000000, created_at: "2024-01-01" },
  { id: "s028", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", cover_url: "/icons/icon-192.png", audio_url: "", duration: 200, genre: "Synth-pop", release_year: 2019, play_count: 32000000, created_at: "2024-01-01" },
  { id: "s029", title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", cover_url: "/icons/icon-192.png", audio_url: "", duration: 355, genre: "Rock", release_year: 1975, play_count: 22000000, created_at: "2024-01-01" },
  { id: "s030", title: "Someone Like You", artist: "Adele", album: "21", cover_url: "/icons/icon-192.png", audio_url: "", duration: 285, genre: "Soul", release_year: 2011, play_count: 19000000, created_at: "2024-01-01" },
  { id: "s031", title: "Rolling in the Deep", artist: "Adele", album: "21", cover_url: "/icons/icon-192.png", audio_url: "", duration: 228, genre: "Soul", release_year: 2010, play_count: 21000000, created_at: "2024-01-01" },
  { id: "s032", title: "Lose Yourself", artist: "Eminem", album: "8 Mile Soundtrack", cover_url: "/icons/icon-192.png", audio_url: "", duration: 326, genre: "Hip-Hop", release_year: 2002, play_count: 17000000, created_at: "2024-01-01" },
  { id: "s033", title: "Hotel California", artist: "Eagles", album: "Hotel California", cover_url: "/icons/icon-192.png", audio_url: "", duration: 391, genre: "Rock", release_year: 1977, play_count: 25000000, created_at: "2024-01-01" },

  // --- 日韩 ---
  { id: "s034", title: "Lemon", artist: "米津玄師", album: "STRAY SHEEP", cover_url: "/icons/icon-192.png", audio_url: "", duration: 254, genre: "J-Pop", release_year: 2018, play_count: 14000000, created_at: "2024-01-01" },
  { id: "s035", title: "夜に駆ける", artist: "YOASOBI", album: "夜に駆ける", cover_url: "/icons/icon-192.png", audio_url: "", duration: 267, genre: "J-Pop", release_year: 2019, play_count: 18000000, created_at: "2024-01-01" },
  { id: "s036", title: "前前前世", artist: "RADWIMPS", album: "君の名は。", cover_url: "/icons/icon-192.png", audio_url: "", duration: 267, genre: "J-Rock", release_year: 2016, play_count: 9600000, created_at: "2024-01-01" },
  { id: "s037", title: "Dynamite", artist: "BTS", album: "BE", cover_url: "/icons/icon-192.png", audio_url: "", duration: 199, genre: "K-Pop", release_year: 2020, play_count: 22000000, created_at: "2024-01-01" },
  { id: "s038", title: "How You Like That", artist: "BLACKPINK", album: "THE ALBUM", cover_url: "/icons/icon-192.png", audio_url: "", duration: 181, genre: "K-Pop", release_year: 2020, play_count: 16000000, created_at: "2024-01-01" },

  // --- 电子 / 轻音乐 ---
  { id: "s039", title: "Faded", artist: "Alan Walker", album: "Different World", cover_url: "/icons/icon-192.png", audio_url: "", duration: 212, genre: "电子", release_year: 2015, play_count: 30000000, created_at: "2024-01-01" },
  { id: "s040", title: "Closer", artist: "The Chainsmokers", album: "Memories...Do Not Open", cover_url: "/icons/icon-192.png", audio_url: "", duration: 245, genre: "电子", release_year: 2016, play_count: 26000000, created_at: "2024-01-01" },

  // --- 古典 / 纯音乐 ---
  { id: "s041", title: "River Flows in You", artist: "Yiruma", album: "First Love", cover_url: "/icons/icon-192.png", audio_url: "", duration: 184, genre: "新世纪", release_year: 2001, play_count: 12000000, created_at: "2024-01-01" },
  { id: "s042", title: "Canon in D", artist: "Johann Pachelbel", album: "Canon in D Major", cover_url: "/icons/icon-192.png", audio_url: "", duration: 337, genre: "古典", release_year: 1680, play_count: 15000000, created_at: "2024-01-01" },

  // --- 额外中文 ---
  { id: "s043", title: "青花瓷", artist: "周杰伦", album: "我很忙", cover_url: "/icons/icon-192.png", audio_url: "", duration: 239, genre: "华语流行", release_year: 2007, play_count: 10200000, created_at: "2024-01-01" },
  { id: "s044", title: "告白气球", artist: "周杰伦", album: "周杰伦的床边故事", cover_url: "/icons/icon-192.png", audio_url: "", duration: 218, genre: "华语流行", release_year: 2016, play_count: 13500000, created_at: "2024-01-01" },
  { id: "s045", title: "追光者", artist: "岑宁儿", album: "追光者", cover_url: "/icons/icon-192.png", audio_url: "", duration: 259, genre: "华语流行", release_year: 2017, play_count: 8900000, created_at: "2024-01-01" },
  { id: "s046", title: "岁月神偷", artist: "金玟岐", album: "岁月神偷", cover_url: "/icons/icon-192.png", audio_url: "", duration: 270, genre: "华语流行", release_year: 2016, play_count: 6200000, created_at: "2024-01-01" },
  { id: "s047", title: "体面", artist: "于文文", album: "体面", cover_url: "/icons/icon-192.png", audio_url: "", duration: 281, genre: "华语流行", release_year: 2017, play_count: 7500000, created_at: "2024-01-01" },
  { id: "s048", title: "消愁", artist: "毛不易", album: "消愁", cover_url: "/icons/icon-192.png", audio_url: "", duration: 273, genre: "华语流行", release_year: 2017, play_count: 8100000, created_at: "2024-01-01" },

  // --- 额外英文 ---
  { id: "s049", title: "Don't Start Now", artist: "Dua Lipa", album: "Future Nostalgia", cover_url: "/icons/icon-192.png", audio_url: "", duration: 183, genre: "Pop", release_year: 2019, play_count: 14000000, created_at: "2024-01-01" },
  { id: "s050", title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", cover_url: "/icons/icon-192.png", audio_url: "", duration: 174, genre: "Pop", release_year: 2019, play_count: 12500000, created_at: "2024-01-01" },
  { id: "s051", title: "Bad Guy", artist: "Billie Eilish", album: "WHEN WE ALL FALL ASLEEP", cover_url: "/icons/icon-192.png", audio_url: "", duration: 194, genre: "Pop", release_year: 2019, play_count: 19000000, created_at: "2024-01-01" },
  { id: "s052", title: "Circles", artist: "Post Malone", album: "Hollywood's Bleeding", cover_url: "/icons/icon-192.png", audio_url: "", duration: 215, genre: "Hip-Hop", release_year: 2019, play_count: 11500000, created_at: "2024-01-01" },
];

// ==================== Mock Playlists (12个) ====================

export const mockPlaylists: Playlist[] = [
  { id: "p001", name: "华语经典 999+", description: "那些刻在DNA里的华语金曲", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p002", name: "周杰伦 全记录", description: "从Jay到最伟大的作品", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p003", name: "英文热单精选", description: "Billboard Hot 100 精选合集", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p004", name: "民谣在路上", description: "一把吉他，一首诗，一段旅程", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p005", name: "摇滚不朽", description: "经典摇滚乐永远年轻", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p006", name: "说唱新世代", description: "中文说唱力量集结", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p007", name: "K-Pop 热潮", description: "最燃最甜的韩国流行乐", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p008", name: "J-Pop 精选", description: "日本流行音乐精选集", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p009", name: "电子音乐实验室", description: "一起进入电子音乐的世界", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p010", name: "深夜自习室", description: "安静纯音乐，适合工作学习", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p011", name: "粤语经典 1980-2010", description: "三十年金曲一网打尽", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
  { id: "p012", name: "R&B 慢灵魂", description: "慵懒节奏，沉浸式体验", cover_url: "/icons/icon-192.png", user_id: "u001", is_public: true, created_at: "2024-01-01", updated_at: "2024-06-01" },
];

// ==================== Mock Artists (10位) ====================

export const mockArtists: Artist[] = [
  { id: "a001", name: "周杰伦", avatar: "/icons/icon-192.png", description: "华语乐坛天王，亚洲流行音乐标杆", albumCount: 15 },
  { id: "a002", name: "陈奕迅", avatar: "/icons/icon-192.png", description: "香港乐坛代表人物，金曲无数", albumCount: 20 },
  { id: "a003", name: "邓紫棋", avatar: "/icons/icon-192.png", description: "创作型女歌手，独特嗓音", albumCount: 8 },
  { id: "a004", name: "薛之谦", avatar: "/icons/icon-192.png", description: "创作歌手，词曲俱佳", albumCount: 10 },
  { id: "a005", name: "李荣浩", avatar: "/icons/icon-192.png", description: "全能音乐人，一个人的乐队", albumCount: 7 },
  { id: "a006", name: "Ed Sheeran", avatar: "/icons/icon-192.png", description: "英国创作歌手，全球流行巨星", albumCount: 6 },
  { id: "a007", name: "Adele", avatar: "/icons/icon-192.png", description: "英国灵魂乐天后，格莱美大满贯", albumCount: 4 },
  { id: "a008", name: "Beyond", avatar: "/icons/icon-192.png", description: "香港传奇摇滚乐队，精神永存", albumCount: 12 },
  { id: "a009", name: "米津玄師", avatar: "/icons/icon-192.png", description: "日本全能创作歌手，现象级音乐人", albumCount: 5 },
  { id: "a010", name: "BTS", avatar: "/icons/icon-192.png", description: "韩国顶级男团，全球文化现象", albumCount: 9 },
];

// ==================== Mock Albums (8张) ====================

export const mockAlbums: Album[] = [
  { id: "al001", name: "七里香", cover: "/icons/icon-192.png", artist: "周杰伦", releaseYear: 2004, songCount: 10 },
  { id: "al002", name: "叶惠美", cover: "/icons/icon-192.png", artist: "周杰伦", releaseYear: 2003, songCount: 11 },
  { id: "al003", name: "÷", cover: "/icons/icon-192.png", artist: "Ed Sheeran", releaseYear: 2017, songCount: 12 },
  { id: "al004", name: "21", cover: "/icons/icon-192.png", artist: "Adele", releaseYear: 2011, songCount: 11 },
  { id: "al005", name: "STRAY SHEEP", cover: "/icons/icon-192.png", artist: "米津玄師", releaseYear: 2020, songCount: 15 },
  { id: "al006", name: "After Hours", cover: "/icons/icon-192.png", artist: "The Weeknd", releaseYear: 2020, songCount: 14 },
  { id: "al007", name: "命运派对", cover: "/icons/icon-192.png", artist: "Beyond", releaseYear: 1990, songCount: 10 },
  { id: "al008", name: "Xposed", cover: "/icons/icon-192.png", artist: "邓紫棋", releaseYear: 2012, songCount: 10 },
];

// ==================== Mock 歌词 (5首完整LRC) ====================

export const mockLyrics: Record<string, string> = {
  s001: `[ti:七里香]
[ar:周杰伦]
[al:七里香]
[00:00.00]七里香 - 周杰伦
[00:15.00]窗外的麻雀 在电线杆上多嘴
[00:19.50]你说这一句 很有夏天的感觉
[00:23.80]手中的铅笔 在纸上来来回回
[00:28.20]我用几行字 形容你是我的谁
[00:33.00]秋刀鱼的滋味 猫跟你都想了解
[00:37.50]初恋的香味 就这样被我们寻回
[00:41.80]那温暖的阳光 像刚摘的鲜艳草莓
[00:46.20]你说你舍不得 吃掉这一种感觉
[00:50.50]雨下整夜 我的爱溢出就像雨水
[00:55.00]院子落叶 跟我的思念厚厚一叠
[00:59.30]几句是非 也无法将我的热情冷却
[01:04.00]你出现在我诗的每一页
[01:08.50]雨下整夜 我的爱溢出就像雨水
[01:13.00]窗台蝴蝶 像诗里纷飞的美丽章节
[01:17.30]我接着写 把永远爱你写进诗的结尾
[01:22.00]你是我唯一想要的了解`,

  s002: `[ti:晴天]
[ar:周杰伦]
[al:叶惠美]
[00:00.00]晴天 - 周杰伦
[00:10.00]故事的小黄花 从出生那年就飘着
[00:16.50]童年的荡秋千 随记忆一直晃到现在
[00:23.00]为你翘课的那一天 花落的那一天
[00:27.00]教室的那一间 我怎么看不见
[00:30.50]消失的下雨天 我好想再淋一遍
[00:37.00]没想到失去的勇气我还留着
[00:43.00]好想再问一遍 你会等待还是离开
[00:51.00]刮风这天 我试过握着你手
[00:56.50]但偏偏 雨渐渐 大到我看你不见
[01:02.00]还要多久 我才能在你身边
[01:07.50]等到放晴的那天 也许我会比较好一点
[01:14.00]从前从前 有个人爱你很久
[01:19.00]但偏偏 风渐渐 把距离吹得好远
[01:24.50]好不容易 又能再多爱一天
[01:30.00]但故事的最后 你好像还是说了拜拜`,

  s023: `[ti:海阔天空]
[ar:Beyond]
[al:乐与怒]
[00:00.00]海阔天空 - Beyond
[00:18.00]今天我 寒夜里看雪飘过
[00:24.00]怀着冷却了的心窝漂远方
[00:30.00]风雨里追赶 雾里分不清影踪
[00:36.00]天空海阔你与我 可会变
[00:42.00]多少次 迎着冷眼与嘲笑
[00:48.00]从没有放弃过心中的理想
[00:54.00]一刹那恍惚 若有所失的感觉
[01:00.00]不知不觉已变淡 心里爱
[01:06.00]原谅我这一生不羁放纵爱自由
[01:12.50]也会怕有一天会跌倒
[01:18.50]背弃了理想 谁人都可以
[01:24.50]哪会怕有一天只你共我
[01:42.00]仍然自由自我 永远高唱我歌
[01:48.00]走遍千里
[01:54.00]原谅我这一生不羁放纵爱自由
[02:00.50]也会怕有一天会跌倒
[02:06.50]背弃了理想 谁人都可以
[02:12.50]哪会怕有一天只你共我`,

  s026: `[ti:Shape of You]
[ar:Ed Sheeran]
[al:÷]
[00:00.00]Shape of You - Ed Sheeran
[00:08.00]The club isn't the best place to find a lover
[00:10.50]So the bar is where I go
[00:13.00]Me and my friends at the table doing shots
[00:15.50]Drinking fast and then we talk slow
[00:17.50]Come over and start up a conversation
[00:19.80]With just me and trust me I'll give it a chance now
[00:22.00]Take my hand, stop
[00:23.50]Put Van the Man on the jukebox
[00:25.50]And then we start to dance
[00:27.00]And now I'm singing like
[00:28.50]Girl, you know I want your love
[00:30.50]Your love was handmade for somebody like me
[00:33.00]Come on now, follow my lead
[00:34.80]I may be crazy, don't mind me
[00:36.50]Say, boy, let's not talk too much
[00:38.50]Grab on my waist and put that body on me
[00:41.00]Come on now, follow my lead
[00:42.80]Come, come on now, follow my lead
[00:45.00]I'm in love with the shape of you
[00:47.00]We push and pull like a magnet do
[00:49.00]Although my heart is falling too
[00:51.00]I'm in love with your body
[00:53.00]Last night you were in my room
[00:55.00]And now my bedsheets smell like you
[00:57.00]Every day discovering something brand new
[00:59.50]I'm in love with your body`,

  s034: `[ti:Lemon]
[ar:米津玄師]
[al:STRAY SHEEP]
[00:00.00]Lemon - 米津玄師
[00:05.00]夢ならばどれほどよかったでしょう
[00:10.50]未だにあなたのことを夢にみる
[00:16.00]忘れた物を取りに帰るように
[00:21.50]古びた思い出の埃を払う
[00:27.00]戻らない幸せがあることを
[00:32.50]最後にあなたが教えてくれた
[00:38.00]言えずに隠してた昏い過去も
[00:43.50]あなたがいなきゃ永遠に昏いまま
[00:49.00]きっともうこれ以上 傷つくことなど
[00:54.50]ありはしないとわかっている
[01:00.00]あの日の悲しみさえ あの日の苦しみさえ
[01:05.80]そのすべてを愛してた あなたとともに
[01:11.50]胸に残り離れない 苦いレモンの匂い
[01:17.50]雨が降り止むまでは帰れない
[01:22.50]今でもあなたはわたしの光`,

  // --- Phase 13: 新增 12 首歌词 ---
  s003: `[ti:稻香]
[ar:周杰伦]
[al:魔杰座]
[00:00.00]稻香 - 周杰伦
[00:12.00]对这个世界如果你有太多的抱怨
[00:15.00]跌倒了就不敢继续往前走
[00:18.00]为什么人要这么的脆弱堕落
[00:22.00]请你打开电视看看多少人
[00:25.00]为生命在努力勇敢的走下去
[00:28.00]我们是不是该知足
[00:30.00]珍惜一切就算没有拥有
[00:34.00]还记得你说家是唯一的城堡
[00:37.50]随着稻香河流继续奔跑
[00:40.50]微微笑 小时候的梦我知道
[00:45.00]不要哭让萤火虫带着你逃跑
[00:48.50]乡间的歌谣永远的依靠
[00:51.50]回家吧 回到最初的美好`,

  s005: `[ti:光年之外]
[ar:邓紫棋]
[al:光年之外]
[00:00.00]光年之外 - 邓紫棋
[00:14.00]感受停在我发端的指尖
[00:17.50]如何瞬间冻结时间
[00:21.00]记住望着我坚定的双眼
[00:25.00]也许已经没有明天
[00:28.50]面对浩瀚的星海
[00:31.50]我们微小得像尘埃
[00:35.00]漂浮在一片无奈
[00:39.50]缘分让我们相遇乱世以外
[00:42.80]命运却要我们危难中相爱
[00:46.50]也许未来遥远在光年之外
[00:50.00]我愿守候未知里为你等待
[00:53.50]我没想到为了你我能疯狂到
[00:57.00]山崩海啸没有你根本不想逃
[01:00.50]我的大脑为了你已经疯狂到
[01:04.00]脉搏心跳没有你根本不重要`,

  s012: `[ti:后来]
[ar:刘若英]
[al:年华]
[00:00.00]后来 - 刘若英
[00:12.00]后来 我总算学会了如何去爱
[00:18.00]可惜你早已远去消失在人海
[00:24.00]后来 终于在眼泪中明白
[00:30.00]有些人一旦错过就不在
[00:37.00]栀子花白花瓣 落在我蓝色百褶裙上
[00:43.00]爱你 你轻声说
[00:49.00]我低下头闻见一阵芬芳
[00:55.00]那个永恒的夜晚 十七岁仲夏
[01:00.00]你吻我的那个夜晚
[01:05.00]让我往后的时光 每当有感叹
[01:11.00]总想起当天的星光
[01:17.00]那时候的爱情 为什么就能那样简单
[01:23.00]而又是为什么人年少时
[01:29.00]一定要让深爱的人受伤`,

  s013: `[ti:十年]
[ar:陈奕迅]
[al:黑白灰]
[00:00.00]十年 - 陈奕迅
[00:08.00]如果那两个字没有颤抖
[00:12.00]你不会发现我难受
[00:16.00]怎么说出口 也不过是分手
[00:20.00]如果对于明天没有要求
[00:24.00]牵牵手就像旅游
[00:28.00]成千上万个门口 总有一个人要先走
[00:36.00]怀抱既然不能逗留
[00:39.00]何不在离开的时候
[00:42.00]一边享受 一边泪流
[00:48.00]十年之前 我不认识你 你不属于我
[00:52.00]我们还是一样 陪在一个陌生人左右
[00:56.00]走过渐渐熟悉的街头
[01:00.00]十年之后 我们是朋友 还可以问候
[01:04.00]只是那种温柔 再也找不到拥抱的理由
[01:08.00]情人最后难免沦为朋友`,

  s015: `[ti:平凡之路]
[ar:朴树]
[al:平凡之路]
[00:00.00]平凡之路 - 朴树
[00:18.00]徘徊着的 在路上的
[00:24.00]你要走吗
[00:30.00]易碎的 骄傲着
[00:36.00]那也曾是我的模样
[00:42.00]沸腾着的 不安着的
[00:48.00]你要去哪
[00:55.00]谜一样的 沉默着的
[01:01.00]故事你真的在听吗
[01:06.00]我曾经跨过山和大海
[01:10.00]也穿过人山人海
[01:13.00]我曾经拥有着的一切
[01:16.50]转眼都飘散如烟
[01:19.50]我曾经失落失望失掉所有方向
[01:26.00]直到看见平凡才是唯一的答案`,

  s024: `[ti:光辉岁月]
[ar:Beyond]
[al:命运派对]
[00:00.00]光辉岁月 - Beyond
[00:12.00]钟声响起归家的讯号
[00:17.00]在他生命里 仿佛带点唏嘘
[00:23.00]黑色肌肤给他的意义
[00:28.00]是一生奉献 肤色斗争中
[00:34.00]年月把拥有变做失去
[00:40.00]疲倦的双眼带着期望
[00:46.00]今天只有残留的躯壳
[00:50.00]迎接光辉岁月
[00:53.00]风雨中抱紧自由
[00:58.00]一生经过彷徨的挣扎
[01:01.50]自信可改变未来
[01:04.50]问谁又能做到`,

  s027: `[ti:Perfect]
[ar:Ed Sheeran]
[al:÷]
[00:00.00]Perfect - Ed Sheeran
[00:10.00]I found a love for me
[00:14.00]Darling just dive right in and follow my lead
[00:20.00]I found a girl beautiful and sweet
[00:27.00]I never knew you were the someone waiting for me
[00:35.00]Cause we were just kids when we fell in love
[00:40.00]Not knowing what it was
[00:43.00]I will not give you up this time
[00:51.00]But darling just kiss me slow your heart is all I own
[00:58.00]And in your eyes you're holding mine
[01:04.00]Baby I'm dancing in the dark with you between my arms
[01:09.50]Barefoot on the grass listening to our favorite song
[01:14.50]When you said you looked a mess I whispered underneath my breath
[01:19.50]But you heard it darling you look perfect tonight`,

  s035: `[ti:夜に駆ける]
[ar:YOASOBI]
[al:夜に駆ける]
[00:00.00]夜に駆ける - YOASOBI
[00:06.00]沈むように溶けてゆくように
[00:11.00]二人だけの空が広がる夜に
[00:16.00]さよならだけだった
[00:18.00]その一言で全てが分かった
[00:20.50]日が沈み出した空と君の姿
[00:23.50]フェンス越しに重なっていた
[00:26.00]初めて会った日から
[00:28.00]僕の心の全てを奪った
[00:30.50]どこか儚い空気を纏う君は
[00:33.50]寂しい目をしてたんだ
[00:36.00]いつだってチックタックと
[00:38.00]鳴る世界で何度だってさ
[00:40.00]触れる心無い言葉
[00:41.50]うるさい声に涙が零れそうでも
[00:45.00]ありきたりな喜びきっと二人なら見つけられる`,

  s043: `[ti:青花瓷]
[ar:周杰伦]
[al:我很忙]
[00:00.00]青花瓷 - 周杰伦
[00:22.00]素胚勾勒出青花笔锋浓转淡
[00:26.50]瓶身描绘的牡丹一如你初妆
[00:31.00]冉冉檀香透过窗心事我了然
[00:35.50]宣纸上走笔至此搁一半
[00:40.00]釉色渲染仕女图韵味被私藏
[00:44.50]而你嫣然的一笑如含苞待放
[00:49.00]你的美一缕飘散去到我去不了的地方
[00:57.50]天青色等烟雨 而我在等你
[01:02.00]炊烟袅袅升起 隔江千万里
[01:06.50]在瓶底书汉隶仿前朝的飘逸
[01:11.00]就当我为遇见你伏笔
[01:15.50]天青色等烟雨 而我在等你
[01:20.00]月色被打捞起 晕开了结局
[01:24.50]如传世的青花瓷自顾自美丽
[01:28.50]你眼带笑意`,

  s044: `[ti:告白气球]
[ar:周杰伦]
[al:周杰伦的床边故事]
[00:00.00]告白气球 - 周杰伦
[00:06.00]塞纳河畔 左岸的咖啡
[00:09.00]我手一杯 品尝你的美
[00:12.00]留下唇印的嘴
[00:17.00]花店玫瑰 名字写错谁
[00:20.00]告白气球 风吹到对街
[00:23.00]微笑在天上飞
[00:28.00]你说你有点难追 想让我知难而退
[00:33.00]礼物不需挑最贵 只要香榭的落叶
[00:39.00]营造浪漫的约会 不害怕搞砸一切
[00:44.00]拥有你就拥有 全世界
[00:49.00]亲爱的 爱上你 从那天起
[00:54.00]甜蜜的很轻易
[00:59.00]亲爱的 别任性 你的眼睛
[01:05.00]在说我愿意`,

  s028: `[ti:Blinding Lights]
[ar:The Weeknd]
[al:After Hours]
[00:00.00]Blinding Lights - The Weeknd
[00:15.00]I've been tryna call
[00:19.00]I've been on my own for long enough
[00:22.00]Maybe you can show me how to love
[00:26.00]I'm going through withdrawals
[00:30.00]You don't even have to do too much
[00:33.50]You can turn me on with just a touch
[00:37.50]I look around and Sin City's cold and empty
[00:41.50]No one's around to judge me
[00:45.00]I can't see clearly when you're gone
[00:48.50]I said I'm blinded by the lights
[00:52.50]No, I can't sleep until I feel your touch
[00:56.00]I said I'm drowning in the night
[01:00.00]I'm blinded by the lights`,

  s039: `[ti:Faded]
[ar:Alan Walker]
[al:Different World]
[00:00.00]Faded - Alan Walker
[00:10.00]You were the shadow to my light
[00:13.00]Did you feel us
[00:16.00]Another start you fade away
[00:19.50]Afraid our aim is out of sight
[00:22.50]Wanna see us alight
[00:28.00]Where are you now
[00:33.00]Where are you now
[00:38.00]Where are you now
[00:41.50]Was it all in my fantasy
[00:44.00]Where are you now
[00:48.50]Were you only imaginary
[00:52.00]Where are you now
[00:55.00]Atlantis under the sea
[00:59.00]Where are you now
[01:02.00]Another dream the monster's running wild inside of me
[01:06.00]I'm faded`,
};

// ==================== 热门搜索词 (20个) ====================

export const mockHotKeywords: string[] = [
  "周杰伦",
  "晴天",
  "七里香",
  "陈奕迅",
  "孤勇者",
  "Beyond",
  "海阔天空",
  "Ed Sheeran",
  "Shape of You",
  "邓紫棋",
  "光年之外",
  "起风了",
  "年少有为",
  "Lemon",
  "YOASOBI",
  "BLACKPINK",
  "Faded",
  "平凡之路",
  "薛之谦",
  "米津玄師",
];
