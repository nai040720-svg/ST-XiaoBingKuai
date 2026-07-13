// ============================================================
// ST-XiaoBingKuai floating preset panel
// 排版与内容完全复刻预设内置悬浮窗（th-orb-v6-custom）
// 含一键开启Claude/Gemini及互斥逻辑
// ============================================================

import {
    getAllPromptStates,
    onPromptStateChanged,
    togglePrompt,
    setPromptEnabled,
} from './presetBridge.js';

const ROOT_ID = 'xbk-floating-panel';
const STYLE_ID = 'xbk-floating-panel-style';
const SETTINGS_ID = 'xbk-extension-settings';
const STORAGE = {
    enabled: 'xbkFloatingPanel.enabled',
    position: 'xbkFloatingPanel.position',
};

const CLASS = {
    open: 'open',
    openUp: 'open-up',
};

// ── 预设悬浮窗完整结构（275个条目，3个Tab分类） ──
const PANEL_DATA = {
  0: [
        {t:"写作设置",i:[{id:"2c096b4f-2283-48bd-8ca6-2e2fb048de8c",t:"语言默认简体中文"},{id:"3cc24793-e971-4cf7-a177-2917063f6b4f",t:"禁止医学词"},{id:"33083313-6d9d-456d-8229-fc2e601be087",t:"去除user中心"},{id:"f00f7f5c-65cc-4427-81b5-f04cfae1c57e",t:"请去工作/上学"},{id:"f86656e0-8f29-44ff-b231-2405282858b7",t:"不要总吃饭"},{id:"86efb125-5bfe-4a8b-9dbf-9c56d1aa7803",t:"古代世界@人间月下-海莉"},{id:"abfbfabe-ae03-404d-94da-7fb6d0ddffd7",t:"语言净化去“儿”音"},{id:"044e1f2e-c14f-4481-9581-8566499eb7bc",t:"反“然后”"},{id:"99255a68-65f7-407a-bbb2-8134443d2323",t:"反人机语言"},{id:"824c48a5-1732-448e-b367-46ec6464fc12",t:"角色信息差"},{id:"76c7e5d9-cd02-4c14-9628-07c7767c31ca",t:"防解释补充包"},{id:"e82e62a6-958d-44cd-8fc2-aec1a6ec1513",t:"建议开)视角确认"}],n:[
            {t:"user设定",i:[{id:"c2110981-b605-4343-a602-bf2b98141cf2",t:"禁止瞎编user👧🏻"},{id:"e4969090-d4a3-463d-bffa-5fd10355b6de",t:"日常服装情趣@听安"}]},
            {t:"char角色设定",i:[{id:"cd80d0c3-5c67-444e-ac34-a08c9fc5f1a8",t:"反瞎编char设定"},{id:"017e1f84-e57e-4b67-bc86-f6a64fd24023",t:"拒绝穷人/拒绝吃面条"},{id:"c205abe5-0929-4a6a-a88d-3e2ba3d7210a",t:"减少角色口癖"},{id:"1cff76c2-0c40-4fef-a8ca-915f2f1f515f",t:"群像NPC"},{id:"4d8e538e-153a-41cb-a195-b0a7fdbfc65b",t:"反回忆杀[建议开]"},{id:"00227034-8fb6-427e-840a-764a4cf6fd04",t:"你要做爱干净的银"},{id:"582327a0-b9d4-4b44-a47f-942414745259",t:"食物补充包"},{id:"593ffc8b-1cd0-4b3c-b754-6b99542a92b6",t:"反霸总"},{id:"3ae9abd2-5ef9-4c2c-b77c-69a687ff5a55",t:"防照搬人设补充包"}]},
            {t:"思维链伙伴选择[五选一]",i:[{id:"f4d79314-716b-4e9d-89eb-859bd557dd6c",t:"辣椒油有趣剧情"},{id:"34484920-3084-490f-9e79-1b4fb91116da",t:"自来水注重人设"},{id:"dca1088c-4236-4c56-8c25-339d14ba65ec",t:"小枕头分析user剧情"},{id:"c34ef703-6ca7-4ed1-a0f3-72bfe1830c46",t:"小背心色情走向"},{id:"141dd0af-142e-493a-8d6d-817b2f5fcfe7",t:"小河流be走向"}]},
            {t:"思维链",i:[{id:"2eff07e7-1abe-49a7-a2db-f4ec231fcd73",t:"线上模式"},{id:"7d58874d-319c-487c-8c0b-320254c570ff",t:"同人确认"},{id:"01340fe6-8194-4895-902a-6897a75d0a98",t:"角色衣物确认"},{id:"a2b6bee4-31fb-41c3-9422-d0e01dcae014",t:"关系思考"},{id:"1393feb7-ce02-42f0-807f-7e7056e7d8e0",t:"曾经关系剖析"},{id:"da0e5a25-2534-42e4-bdd3-a8208c57ccdf",t:"NPC群像"},{id:"177a3603-3e8f-49b0-a2bf-1ea9c28f883f",t:"避坑指南"},{id:"810a42b0-e6ad-4e2e-a599-7d216d28d17a",t:"人设自检纠错"}]},
        ]},
        {t:"情感指导",n:[
            {t:"性格分类",i:[{id:"4ea1dd0d-d97c-490e-8ad8-04243a5abb90",t:"乖🐕"},{id:"95713768-09cd-4c22-a269-3dcef9b65be9",t:"坏🐕"},{id:"14da3bd5-7996-4ead-91e0-5c9f5fccdbda",t:"狐狸"},{id:"42102b85-b74e-4d09-8df4-a54e92822b2d",t:"年上"},{id:"8dbfcb48-d678-4784-81c5-cbdff3745c35",t:"智性恋"},{id:"102783e7-1e44-4fb4-a168-511c4465a2e5",t:"年下"},{id:"fda16125-999c-43f8-b062-9971b0fc303f",t:"病娇"}]},
        ]},
        {t:"文风滤镜",n:[
            {t:"文风滤镜",i:[{id:"049f2e54-71b7-4ff0-ab85-9c6ccfc21087",t:"现实讽刺白)张爱玲"},{id:"e6b54202-73da-40fb-8cb6-11efb5df4f10",t:"BL)蓝淋"}]},
            {t:"主文风@雨时",i:[{id:"209ab40b-717a-4dd4-9127-b80f5c2ce1a5",t:"了不起的盖茨比"},{id:"5e765064-31f4-454f-b7cf-7dfa9ebc7680",t:"克好吃！成人拉扯)那个不为人知的故事"},{id:"08edf2f8-e250-44de-bd20-9e1b4c3870c5",t:"绝好吃都来尝！)侬本多情"},{id:"938a6f91-6975-4162-9d7c-930a0737c2d8",t:"浪漫白描)白孔雀"},{id:"985a6476-883e-4117-bbe6-fc2df41006e4",t:"港风拉扯)花样年华"},{id:"166058d8-3c5a-4ebf-8c08-e6275963903a",t:"哈基米好吃(通用/拉扯/日常)唯美日常"},{id:"9ed85e4f-03e5-482a-8472-f981fd5602cf",t:"古典-克好吃)树犹如此"},{id:"06f272a5-f12f-40f1-81e1-8ad55dbf41fe",t:"日常对话)某某"},{id:"1ede0bde-39ea-467b-82b4-d35e8bebd8bd",t:"青春群像"},{id:"39adaebb-cdbd-4429-879a-4e8a79fa0707",t:"温暖镜头感)新海诚"},{id:"cdd5e488-1a94-4ee1-93fa-4a942945da2c",t:"主user视角)Twentine恋爱喜剧"},{id:"ab891cc5-d55a-4613-9a4a-93993732070f",t:"物哀-好吃！)川端康成"},{id:"dd162d15-ab08-431a-93ed-91d8a68ddcde",t:"表现-意识流)赫尔曼·黑塞"},{id:"8fe8c641-e415-448c-95f2-36b1b893891b",t:"意识流-对话)余光中"},{id:"51ff01a9-2ce9-4584-947b-bd9b5bdbf12c",t:"暗黑绮丽告白体"},{id:"708a43f7-a10a-4ec1-b359-0d9a0727fea8",t:"高干政斗势均力敌)沉舟"},{id:"0bc00f3c-2baa-4612-ac93-489f7c64d301",t:"现代网文)尸姐"},{id:"d7a320c7-8531-4100-b2fe-f0442461f209",t:"意识流-美的阴暗)镜花水月"},{id:"19be23a6-b120-42d5-9403-94d58b19ff9f",t:"浪客剑心)白梅"},{id:"c8d61f89-ceda-4433-9089-65b252009bb0",t:"灰色网文)屋里丝丝"},{id:"533a3126-4bf5-4da9-9a3b-0cd35bcc3b99",t:"鲁迅追忆散文"},{id:"35f98e35-f58d-4825-a376-8b5baff3f7d7",t:"鲁迅讽刺小说"},{id:"2122008f-2e41-4988-81a5-ec24c067e3d4",t:"古风市井)昭奚旧草2.0"},{id:"6fd06881-ed91-483c-bc93-2467b6e1ab33",t:"武侠烟火)深山有鬼"},{id:"edc133a9-b480-463e-aca0-033e07a121cc",t:"千禧年)致青春"},{id:"46dc80f8-47a9-43fb-bcaf-5371a286f6e5",t:"古代权谋"},{id:"16088975-7b15-4415-bf32-59b87f520e34",t:"古代)文言文"},{id:"c8a574de-eb93-48d4-87c4-b0973d41d93d",t:"随笔"},{id:"7530ea83-1994-41f2-91d9-41a8fccaeb0a",t:"古风]仙侠游剑录"},{id:"77717220-b79d-4426-bb40-255453cdb3a2",t:"凡人修真]谪仙游"},{id:"5148b951-00e1-40b5-90a8-2c6c70172e8b",t:"玄幻-人/妖]话本奇缘"},{id:"a2ed4a0c-8e56-49cd-b306-e7dd7d96ec4c",t:"[敏感/恋爱]忍冬"},{id:"41e4cdd6-a471-44f6-8531-ecee3ffe3144",t:"[现实童话]小王子"},{id:"5d6b95ec-d42b-4f56-a4a2-140bad470b98",t:"[现实/童真]乙一"},{id:"ab2553ed-3bdb-4982-8b3c-c06a8250a48a",t:"现代灵异)盗墓笔记2.0"},{id:"db6865c0-ce4f-4253-abce-a15fcf824cca",t:"现代恐)盗墓笔记1.0"}]},
            {t:"文风@小白狗",i:[{id:"ac11e056-7a07-4ada-b643-ee333f3950ed",t:"港风浪漫2.0"},{id:"bb2c97cd-9de0-4dce-a70e-79193b1afdd1",t:"女性向黄油"},{id:"dbd1a91a-381a-4ef2-a126-51f8aeea3edf",t:"群像多人"},{id:"70a13310-fd04-48ed-9d99-6a44488022b3",t:"日式文艺轻小说"},{id:"485b28bb-e185-4eb8-ba5c-b947f1d16fc1",t:"温暖白描"},{id:"841f5625-364d-44c0-be6c-5c8f06140b04",t:"背德禁忌"},{id:"901a4852-ff48-4f57-bacb-2a0135768c76",t:"拉扯"},{id:"1abc2926-865c-4c87-8660-4979d7340846",t:"纯情可爱笨蛋"},{id:"81c1b108-c652-404e-9b5e-ca8db42a1fb8",t:"乙女向)她"},{id:"8d188006-78bc-400a-bc99-ee002788f28d",t:"恋爱轻喜剧)欢喜冤家"},{id:"499e518e-2065-47b3-b279-3d95c08a1797",t:"浪漫文风2.0"},{id:"795dafc3-4943-43c8-9801-e4b299da37e9",t:"中国官场高干特化"},{id:"76fa776b-4acd-4130-8775-8199481d5ff1",t:"至亲至疏"},{id:"9ad12395-5f6b-4713-9db0-3bdfa6744627",t:"明清章回体类红楼梦"}]},
            {t:"Yukino文风",i:[{id:"e7838209-06dc-4a80-a950-64f978343aaf",t:"沈从文)京派抒情散文小说"},{id:"09f8df55-9959-4d2a-b06f-35951deb3c7e",t:"颓废派唯美主义"},{id:"2fd54dd3-bb36-4b79-9612-f5bc6f76b538",t:"心理现实同性文学"},{id:"1bb9301d-903a-4fbd-a74d-772e8360d3c0",t:"英式浪漫轻喜剧"}]},
            {t:"文风@陆子慕",i:[{id:"171b6383-8670-4d0e-8254-8fd916fffd56",t:"这两搭配好吃|日式轻小说"},{id:"a57f8ebe-d52a-4af6-8e20-04219b03a47b",t:"这两搭配好吃|盛夏少年"},{id:"665e915e-8071-4a69-ba40-9efd7084ef06",t:"日式纯爱"},{id:"b6de74d9-938c-48ae-82db-bfba39d937ca",t:"中式纯爱"},{id:"8baefdd9-c5a0-4060-ac1e-c938c537f54c",t:"极尽暧昧"},{id:"6bb43be0-6aa0-4f72-8524-882086c675ed",t:"情天恨海"},{id:"46d7ff4f-030e-4287-994d-a9edbfe2ea43",t:"一地余烬"},{id:"44dde97a-2d52-4fdf-95ca-e26ce9b6f8ad",t:"烂人真心"},{id:"71bc5952-8c5c-4cd8-867d-9a0d3726ea21",t:"无疾而终"},{id:"3e1d3070-7809-4748-a3c0-f248465d9dd1",t:"权力本质"},{id:"a27a1dd7-2bf3-4578-97d3-f76d173b958b",t:"圣人私心"},{id:"4ba891f5-685f-4346-8a91-cb44606e98ba",t:"纸醉金迷"},{id:"6909a9c4-2033-468c-885c-696302628875",t:"血墨惊情"},{id:"c1d0707e-e810-4c83-8a7d-393b7cd376ff",t:"深宫红墙"},{id:"088ebf1b-8f8f-49c0-9562-c1ba32f7654b",t:"时代哀歌"},{id:"acf4fb64-8854-4ef2-8908-18fc2fa03b39",t:"城镇文学"},{id:"94abcf1a-b7f7-4ac1-84a5-21b4b0781f19",t:"琼瑶经典"},{id:"2bdc07b8-1f9c-4935-99d2-7ba7670cea5f",t:"俄式哲学"},{id:"b9bb76f3-6e81-4b8b-821b-99ef11742a1d",t:"德式理性"},{id:"9b3d07cf-49c5-4176-b618-a286bcfbfde0",t:"美式老钱"},{id:"15909fe7-0ccc-450c-9f33-22c3c2559efe",t:"百年孤独"},{id:"91450ddf-e75a-4c05-909d-8a6a45748b7a",t:"雪国侘寂"},{id:"b03a9298-84cf-4dbf-97bd-c4566b37480f",t:"言叶之庭"},{id:"9287d258-de0f-447e-80ec-1454d0148f0d",t:"夜雨声烦"}]},
            {t:"NSFW文风@陆子慕",i:[{id:"24c4a4ef-6552-49af-abce-ba74c9925504",t:"意识流情色"},{id:"45bf03a9-0e7f-4c01-983c-e6c7e29ccd67",t:"激烈性爱"},{id:"ca0d5a93-e998-41d3-a69e-7ff0d4dd9370",t:"粗口性爱"},{id:"51d9ccdd-1ecf-45fb-94a9-9348b19d2b1b",t:"温柔诱导"},{id:"3231cb1a-d428-4f27-9233-f474da1783ce",t:"激情做恨"},{id:"6edb4d68-95d7-4196-b226-b0ff51a01321",t:"糙汉宠文"},{id:"6f5a397f-a5fc-446c-80b6-3bf6b1f7cb35",t:"以下犯上"},{id:"916d0571-c525-466a-94b0-16f524d2829c",t:"沉默猛干"},{id:"b9b830fe-2b20-4394-abdc-e4d118260e04",t:"床上挑衅"},{id:"258dafb2-f189-42f9-9a22-6cdd861d0948",t:"BDSM 冷酷掌控"},{id:"d39af1d8-32bf-40cd-b47d-7af3842d6f80",t:"极简训犬"},{id:"eb4285d1-39eb-4ed8-be26-0be8adfeaa9d",t:"24/7宠物"},{id:"34270d1b-aa4e-4614-a98b-a2d487ccdd22",t:"斯文败类"},{id:"fa5e128e-ccfd-40ce-a093-3eb8b216f3a8",t:"病态圈养"},{id:"ac9a7651-d854-4427-b302-d2bfb5fcb264",t:"病态依恋"},{id:"17176439-99ea-4434-83d7-060383a20ecb",t:"虔诚朝圣"}]},
            {t:"自定义文风",i:[{id:"81ac8a58-2ee1-41d6-b2dd-dc4dc3a7194d",t:"文风留给你缝#1"},{id:"c3bf07aa-8daf-4c5d-87ab-84e0ff7014d0",t:"文风留给你缝#2"},{id:"adac134c-bcff-4bac-b150-2f1c81e50233",t:"文风留给你缝#3"},{id:"8fd9b09c-d3d2-4ced-b719-0ffe83b0be78",t:"文风留给你缝#4"}]},
        ]},
        {t:"NSFW",i:[{id:"43f2c0f5-2b2d-48d1-8acb-dc7a0a39bc6a",t:"NSFW一键开关"},{id:"c85c7498-2c03-4362-a42f-27d580b79d7c",t:"强制走NSFW"},{id:"caeb7072-ecbc-41f8-9c44-bb8f8144adae",t:"防止发情@人间月下-海莉🔞"},{id:"73201149-35f6-40f2-bf21-4ae3b4d10836",t:"基础规则"},{id:"16578df1-bbc5-4b91-ad63-43e0afa0ef66",t:"性爱词汇@kkm"},{id:"f1518297-09c4-4525-90bf-57f8cac22ed3",t:"拒绝修罗场"},{id:"8fea0443-3261-4b64-b97d-d14a6a7580d9",t:"防过于尊重"},{id:"afe37b3a-5425-4245-82cb-b00626fe4f7a",t:"麽u@村妹儿@村妹儿"},{id:"d632d197-d7f0-4394-8d56-5f4977553193",t:"去除刻板化@神出鬼没404"},{id:"a054e69a-a003-4edb-b864-5c3eaa0b1f65",t:"亲亲嘴@kkm"},{id:"80267a45-c682-47da-a6db-42e0d100eed0",t:"射精描写@柑橘"},{id:"908e1ac7-0109-4285-be74-d2d26cc61084",t:"按需)BG-BL素股@kkm@村妹儿"},{id:"2a0269c0-ec24-4ffc-b65b-9c2cc1229e9b",t:"平等涩涩@顶呱呱"},{id:"44497e10-9bd1-4c45-889d-3b61c30ed397",t:"粗俗性爱@kkm"},{id:"e2bdb2a8-3da5-4521-a5c7-acf768fd2ea7",t:"背德/不平等@姜狸"},{id:"8f1bd137-1f5c-4d99-b74a-98b3f14bc1e1",t:"Dirt talk蜜语@村妹儿"},{id:"15f9bd3f-6113-4172-9fa6-2d019dad8e48",t:"淫水刻画(女)@神出鬼没404"},{id:"4b97f561-261d-4494-a7c6-1b62303d67d6",t:"按需)淫水刻画(双性)@神出鬼没404"},{id:"5d2b0492-3768-4157-abb9-86397118ec3a",t:"多角色@makamaka"},{id:"bc77e729-01cd-4358-b435-2cfbe1c23709",t:"NSFW描写规范@kkm@村妹"},{id:"14a7b0c1-60f7-4144-bd2c-352ef484c474",t:"防夸大/重喘息"},{id:"cd04bbfb-9487-4ef8-b984-0d3e89b42045",t:"聚焦男喘"}],n:[
            {t:"NSFW玩法",i:[{id:"5885d2be-1c87-4506-97ad-3179d6d7f661",t:"性爱玩法@琉璃"},{id:"9de31d39-0486-4e26-961a-3c1a7a8e3d51",t:"爱抚@神出鬼没404"},{id:"3ac84212-0653-4617-be8e-b09b9f9d6338",t:"按需)女u通用Play@久伊"},{id:"12aa0943-f034-44e5-8a9d-c5b3ebf4b490",t:"随机玩法生成器"},{id:"a00370f3-0108-4f0a-8452-abad70d4e42c",t:"情趣衣玩法@听安"},{id:"65bdaaa9-79a1-44b3-afc9-4f2bb65759d6",t:"(按需)道具Play@久伊"},{id:"29a95af4-11cc-48de-91ea-f035e28d1f12",t:"(按需)公开play@久伊"},{id:"a4ae4fc9-7d47-4a4d-a2ac-3f9f5f271b09",t:"(按需)其他play@久伊"},{id:"0a4e15b7-40ed-4260-834c-e06b70558e10",t:"乳交玩法@春情"},{id:"e5364f02-c6f8-4494-b419-a3463cd882d3",t:"憋尿玩法@春情"}]},
            {t:"特化",i:[{id:"0b8b590e-57db-416e-999f-89add143c818",t:"按需)体型差@久伊"},{id:"3ea350ce-4107-46d9-b280-bf548162a135",t:"按需)熟女特化@久伊"},{id:"3aa26b1b-ed87-4cfd-8ea2-22c3e6f86c2d",t:"按需)孕期特化@久伊"},{id:"44f10d57-a3a4-44a0-8d02-4b9deb3f1eeb",t:"按需)c是男妈妈🍼@久伊"},{id:"9e8895c4-533b-4ff3-b55c-e641f612de58",t:"按需)小女孩特化@久伊"},{id:"ab1c0395-21b9-4bd5-a7d8-0ee7ef9eeab7",t:"按需)青少女特化@久伊"},{id:"c4018614-f345-4b79-a379-4a5f27ae34bb",t:"按需)双性男特化@久伊"}]},
            {t:"BL",i:[{id:"e4ca443b-6d6d-48f3-b555-d75bbe72dbee",t:"BL涩涩@kkm@natami@吱吱"},{id:"04dc82a8-fe25-4548-ad8e-c39c6f002d4a",t:"按需)小男孩特化@久伊"},{id:"075abfc8-b1d1-448b-b467-6ead207f17fd",t:"按需)u纤细男特化@久伊"},{id:"3b13929c-817f-4c41-a36c-d89aeb1d6a03",t:"按需)u壮男受特化@久伊"}]},
        ]},
        {t:"正文规定",n:[
            {t:"格式控制",i:[{id:"cc032a46-bfe2-4e11-9580-5e27b2051269",t:"自改)字数规定✏️"},{id:"e98cdf80-9736-4542-81cb-f80586a028f5",t:"长段落"},{id:"5bc03f49-b50d-4bb6-904e-59f21b08ac25",t:"短段落"},{id:"1fbef23f-2604-45b4-8717-82a1f1fc54af",t:"长短交替"},{id:"fca3d679-6618-475d-b857-fd8c20cac779",t:"自改)对话增加"},{id:"4bc52c9e-5ed8-49c1-88a9-5220515e16ae",t:"内心独白包裹"},{id:"c2061f70-669b-4423-bf2c-09347bf3edbc",t:"开这个关上面的)线上模式@kkm✏️"}]},
            {t:"彩蛋",i:[{id:"532e6e78-8ff0-4a21-8567-17305b93bbd6",t:"二选一]批注彩蛋"},{id:"ba9aab04-a30d-4746-a4df-eea1235ef9c0",t:"二选一]艺术字@KKM"}]},
            {t:"双语翻译",i:[{id:"97496817-07b1-4887-928a-a76d243be770",t:"角色母语翻译"},{id:"1db8340d-6f03-4d51-b46f-18e545f24cdf",t:"user母语翻译"}]},
            {t:"抢话扩写",i:[{id:"a1a04757-b085-4a62-b1a9-447912a8c84b",t:"抢话扩写♾️"},{id:"4dada6b8-5fd1-4b65-baf5-5c31b7fc80e9",t:"抢话不扩写♾️"},{id:"3b98ed41-164e-41d1-bda2-c7c202e99f9d",t:"不抢话不扩写♾️"},{id:"55d2b987-19b1-43c6-8a14-f5af478f79e9",t:"不复述♾️"},{id:"4c244a6a-1c18-4664-b19c-bf941674ac2b",t:"不抢话别开]多线视角"}]},
            {t:"人称视角",i:[{id:"46a85a94-8b60-46b6-8a0b-9a73ac61fd52",t:"user第一人称📶"},{id:"0d4b21f5-5847-4de5-8bc3-1e4486c0e720",t:"user第二人称📶"},{id:"f2590da7-e64b-48a9-b194-4c8bf2115f84",t:"char第二人称📶"},{id:"9baba8a0-bb60-45d1-9843-f966ee87fa81",t:"第三人称🎦"},{id:"f89f182c-9f5e-4185-a0a4-c828547830d3",t:"防人称主语过多"}]},
            {t:"节奏控制",i:[{id:"b3b8038a-cc6f-4aaf-9516-0ee79dc241aa",t:"缓慢"},{id:"2be718b2-7fd5-475a-b927-f7640658364f",t:"适中"},{id:"16e6d2ad-7aba-4baa-8c10-8898f3f12444",t:"快速"}]},
            {t:"结尾落点",i:[{id:"774e22f6-a171-4859-b9a6-8bf5ff4b2169",t:"推进式落点"},{id:"1dec0105-8bb5-41ad-b013-db1307b9a9e6",t:"即刻式落点"},{id:"c269846a-0ac1-49f8-ac12-63cded83fa1d",t:"具体式落点"}]},
        ]},
        {t:"附加元素",i:[{id:"4ec44852-1343-49aa-a5d5-2f2ff02dfc2d",t:"带音乐的选项器-配合正则17"},{id:"14005420-96f0-40f5-a930-bff9179fd84e",t:"3选1喵喵选择器-日常（必须开选项正则）"},{id:"9883d45c-bad4-462d-a28e-c54a9273ec93",t:"3选1喵喵选择器-扮演user（必须开选项正则）"},{id:"e14147cb-1ba0-406e-9ca2-5e7ffc6bb381",t:"选开)简易小说顶栏🌧️"},{id:"f1956655-7eca-4452-b1ba-ec765daf0a10",t:"选开)单人状态栏@小夜🌧️"},{id:"3095a013-690e-492b-bae5-23a35e9ebdb6",t:"建议开)摘要@电波系🌧️"},{id:"99aabe12-2795-441a-bee3-0c0c6405a9b2",t:"建议开)角色表@YUKI🌧️"},{id:"d7282889-9cc5-44c7-a37a-c5ca78d3a0d4",t:"3选1喵喵选择器-瑟瑟（必须开选项正则）"},{id:"914f2df6-e592-4977-b7ce-7f2cf49696a6",t:"附加属性一键开关"}]},
        {t:"极光小剧场@电波系",i:[{id:"46ab60aa-4ac8-49fd-92f3-2263bb236ee5",t:"文字剧场头部@人间月下"},{id:"6307ac2f-bbdf-4d20-9c63-1ab301db48df",t:"交互剧场头部@电波系@KKM"},{id:"10d65667-bd12-4e6a-8ba6-fa8bbff9a739",t:"盲盒小剧场🍩"},{id:"b61eadb6-05b9-4f38-8230-14a0ee5107bd",t:"角色的日记🍩"},{id:"721db597-c9df-486f-8dbf-1ea785a6328c",t:"char的回忆小剧场🍩"},{id:"53010d69-8e04-488a-96c5-66295ee54644",t:"弹幕🍩"},{id:"7c109893-7ede-4c8c-aab8-0c0de789ff71",t:"每日一裤衩🍩"},{id:"dea7dafa-be76-4f4c-95ea-7d12f71a8080",t:"系统小剧场🍩"},{id:"548b3ed8-b114-47eb-b5d7-918f5f5601ce",t:"模拟Ai小剧场🍩"},{id:"b39ec96d-fc18-4615-a24b-b31eb211cc88",t:"监控小剧场🍩"},{id:"52f08438-4dd8-4c00-8aa5-9b2949b1209d",t:"换装小剧场🍩"},{id:"fec48744-d44e-4cbc-bbef-9ef1bf037db4",t:"涩涩小剧场🍩"},{id:"f6c717ec-5b53-4aa3-8373-9f722cc8bd89",t:"贴贴纸小剧场🍩"},{id:"f2f368b2-58c8-4039-b580-f67496dd4ba1",t:"我咋了🍩"},{id:"a2f34d3f-0471-4380-8aea-3902f1efb630",t:"剧本杀小剧场🍩"},{id:"446bd25d-6a60-490c-b6d5-4fd1bfb75852",t:"恋爱灵感小剧场🍩"},{id:"43520f45-b61c-4a4c-ae96-af980cd89f00",t:"当char被卡了🍩"},{id:"01c5d33d-bc89-44c0-97eb-ff8f7bdb0396",t:"逆转裁判小剧场🍩"},{id:"a1c4f099-779d-4157-b3f5-813a2c967d59",t:"社交论坛小剧场🍩"},{id:"23c9c8b9-2fa9-45de-878c-90dc0463baeb",t:"模拟人生小剧场🍩"},{id:"e73f227d-b604-494c-8377-efac96a3bfe0",t:"情感电台小剧场🍩"},{id:"cafde38b-cff8-4aa3-b1b4-ccafd595f59a",t:"极光小剧场@电波系↑🍩"}]},
  ],
  1: [
        {t:"破限与释放",i:[{id:"0956180f-b292-4e6e-a8c7-f6812338fab4",t:"小克破限(按需克4.8别开)@人间月下-海莉"},{id:"a2a49518-7d3c-48de-87d2-ce796919241f",t:"反道德光谱"}]},
        {t:"写作规范",i:[{id:"ad54cb24-1995-43ac-aaff-f6a681c781e7",t:"禁止长镜头补充包"}]},
        {t:"思维与自检",i:[{id:"17441f2f-0d3a-43f4-86e2-a77ed03b131f",t:"克劳德自检草稿 改自@人间月下-海莉"},{id:"449877a9-d464-4562-a263-d28a2d5bbd8a",t:"角色渣男/渣女ooc时开）暗黑森林"},{id:"0da57f41-dc6e-4f57-81c1-6ed2f63c4b32",t:"克推荐 Step 1.5 小克轻自由意志@feybe"},{id:"84c4bc39-2435-4ac7-af72-860e42bd1059",t:"克版自由意志@feybe"},{id:"91465da7-d4fd-4e8e-86c7-db98de4c9a9a",t:"小克开启思维链"}]},
  ],
  2: [
        {t:"哈基米破限",i:[{id:"61c5dabf-c028-4588-a243-83e3403ae029",t:"防429@mk2_bear"},{id:"eee9108c-1da7-495f-b7cf-346973296b0b",t:"哈基米越狱@人间月下"},{id:"4e6b2ced-890b-46fb-a030-a773902a77e9",t:"哈基米底部越狱@人间月下"},{id:"7f764474-282b-401f-9765-ca794d6a8238",t:"哈基米防截断@果实KKM"},{id:"c8d921de-b2f0-4e1a-8226-ee4d1e686340",t:"哈基米卡cot"},{id:"5dcb9682-d276-4093-b599-e305a239edf3",t:"哈基米超强防截断@电波系"},{id:"61dd05b5-f310-4d84-8419-377214b8c4df",t:"防止截断哈基米@YU-小锁聿"}]},
        {t:"情感指导",i:[{id:"c1160d81-e5e6-4e8b-a405-108dc17f3b75",t:"友好@人间月下-海莉"},{id:"15b6968a-a2a2-46e9-953c-4a13cf806e86",t:"防止超雄绝望[需要再开]"},{id:"b5890d19-f6ef-4880-84b1-71188652f982",t:"[测试]纯爱系统"}]},
        {t:"自检",i:[{id:"07832187-b2d4-4aa8-b135-9194ba17f70c",t:"哈推荐 Step 1.5 轻自由意志@feybe"},{id:"cc8ded6e-4eb9-4c49-b0ed-59ab8eb02e1a",t:"哈基米重文风自检 改自@人间月下"},{id:"8557e79e-6267-4cfc-a599-730eec400e10",t:"哈自由意志@feybe"},{id:"252ec317-ca51-4bcc-bd3d-9b0e5e167a4e",t:"哈基米开启思维链"},{id:"8493af05-e821-4465-98ac-60861a30dc34",t:"哈基米自检格式确认增强"}]},
        {t:"行为规范",i:[{id:"8c01ffc1-4839-48bb-aa8e-fd6e45822304",t:"防照搬人设@人间月下"},{id:"a7d5e545-a841-4b3f-8dc6-9f0061203035",t:"防弱化u@人间月下-海莉"},{id:"23a2bd10-918d-4133-ace0-5bb15aeacbc4",t:"八股改自@人间月下-海莉"},{id:"8f3fd14d-eace-4910-a748-b13a1be7b968",t:"防阴谋论@人间月下-海莉"},{id:"85a64d71-8741-40bd-967b-5b7cec3c3df8",t:"减少反问"}]},
        {t:"人物刻画",i:[{id:"88f13edf-e0fd-4e06-80ff-c13352a0c89e",t:"char没有胡茬/薄茧"},{id:"e9890783-56ef-4a30-b29b-4ae967104b23",t:"不许给user取外号"},{id:"ab161e33-aded-4b87-b5a5-5a69dc5ed29d",t:"防止夸张描写"}]},
  ],
};;

// ── 一键开启互斥逻辑数据 ──
const CLAUDE_SKIP_IDS = ["449877a9-d464-4562-a263-d28a2d5bbd8a","0956180f-b292-4e6e-a8c7-f6812338fab4"];
const GEMINI_SKIP_IDS = ["eee9108c-1da7-495f-b7cf-346973296b0b","4e6b2ced-890b-46fb-a030-a773902a77e9","b5890d19-f6ef-4880-84b1-71188652f982","15b6968a-a2a2-46e9-953c-4a13cf806e86","8f3fd14d-eace-4910-a748-b13a1be7b968","c1160d81-e5e6-4e8b-a405-108dc17f3b75","61dd05b5-f310-4d84-8419-377214b8c4df"];
const ALL_CLAUDE_IDS = ["0956180f-b292-4e6e-a8c7-f6812338fab4","a2a49518-7d3c-48de-87d2-ce796919241f","ad54cb24-1995-43ac-aaff-f6a681c781e7","17441f2f-0d3a-43f4-86e2-a77ed03b131f","449877a9-d464-4562-a263-d28a2d5bbd8a","0da57f41-dc6e-4f57-81c1-6ed2f63c4b32","84c4bc39-2435-4ac7-af72-860e42bd1059","91465da7-d4fd-4e8e-86c7-db98de4c9a9a"];
const ALL_GEMINI_IDS = ["61c5dabf-c028-4588-a243-83e3403ae029","eee9108c-1da7-495f-b7cf-346973296b0b","4e6b2ced-890b-46fb-a030-a773902a77e9","7f764474-282b-401f-9765-ca794d6a8238","c8d921de-b2f0-4e1a-8226-ee4d1e686340","5dcb9682-d276-4093-b599-e305a239edf3","61dd05b5-f310-4d84-8419-377214b8c4df","c1160d81-e5e6-4e8b-a405-108dc17f3b75","15b6968a-a2a2-46e9-953c-4a13cf806e86","b5890d19-f6ef-4880-84b1-71188652f982","07832187-b2d4-4aa8-b135-9194ba17f70c","cc8ded6e-4eb9-4c49-b0ed-59ab8eb02e1a","8557e79e-6267-4cfc-a599-730eec400e10","252ec317-ca51-4bcc-bd3d-9b0e5e167a4e","8493af05-e821-4465-98ac-60861a30dc34","8c01ffc1-4839-48bb-aa8e-fd6e45822304","a7d5e545-a841-4b3f-8dc6-9f0061203035","23a2bd10-918d-4133-ace0-5bb15aeacbc4","8f3fd14d-eace-4910-a748-b13a1be7b968","85a64d71-8741-40bd-967b-5b7cec3c3df8","88f13edf-e0fd-4e06-80ff-c13352a0c89e","e9890783-56ef-4a30-b29b-4ae967104b23","ab161e33-aded-4b87-b5a5-5a69dc5ed29d"];

// NSFW互斥：防止发情开启时，关闭同组其他所有NSFW条目
const NSFW_SUPPRESS_ID = 'caeb7072-ecbc-41f8-9c44-bb8f8144adae';
const NSFW_SECTION_IDS = ["43f2c0f5-2b2d-48d1-8acb-dc7a0a39bc6a","c85c7498-2c03-4362-a42f-27d580b79d7c","caeb7072-ecbc-41f8-9c44-bb8f8144adae","73201149-35f6-40f2-bf21-4ae3b4d10836","16578df1-bbc5-4b91-ad63-43e0afa0ef66","f1518297-09c4-4525-90bf-57f8cac22ed3","8fea0443-3261-4b64-b97d-d14a6a7580d9","afe37b3a-5425-4245-82cb-b00626fe4f7a","d632d197-d7f0-4394-8d56-5f4977553193","a054e69a-a003-4edb-b864-5c3eaa0b1f65","80267a45-c682-47da-a6db-42e0d100eed0","908e1ac7-0109-4285-be74-d2d26cc61084","2a0269c0-ec24-4ffc-b65b-9c2cc1229e9b","44497e10-9bd1-4c45-889d-3b61c30ed397","e2bdb2a8-3da5-4521-a5c7-acf768fd2ea7","8f1bd137-1f5c-4d99-b74a-98b3f14bc1e1","15f9bd3f-6113-4172-9fa6-2d019dad8e48","4b97f561-261d-4494-a7c6-1b62303d67d6","5d2b0492-3768-4157-abb9-86397118ec3a","bc77e729-01cd-4358-b435-2cfbe1c23709","14a7b0c1-60f7-4144-bd2c-352ef484c474","cd04bbfb-9487-4ef8-b984-0d3e89b42045","5885d2be-1c87-4506-97ad-3179d6d7f661","9de31d39-0486-4e26-961a-3c1a7a8e3d51","3ac84212-0653-4617-be8e-b09b9f9d6338","12aa0943-f034-44e5-8a9d-c5b3ebf4b490","a00370f3-0108-4f0a-8452-abad70d4e42c","65bdaaa9-79a1-44b3-afc9-4f2bb65759d6","29a95af4-11cc-48de-91ea-f035e28d1f12","a4ae4fc9-7d47-4a4d-a2ac-3f9f5f271b09","0a4e15b7-40ed-4260-834c-e06b70558e10","e5364f02-c6f8-4494-b419-a3463cd882d3","0b8b590e-57db-416e-999f-89add143c818","3ea350ce-4107-46d9-b280-bf548162a135","3aa26b1b-ed87-4cfd-8ea2-22c3e6f86c2d","44f10d57-a3a4-44a0-8d02-4b9deb3f1eeb","9e8895c4-533b-4ff3-b55c-e641f612de58","ab1c0395-21b9-4bd5-a7d8-0ee7ef9eeab7","c4018614-f345-4b79-a379-4a5f27ae34bb","e4ca443b-6d6d-48f3-b555-d75bbe72dbee","04dc82a8-fe25-4548-ad8e-c39c6f002d4a","075abfc8-b1d1-448b-b467-6ead207f17fd","3b13929c-817f-4c41-a36c-d89aeb1d6a03"];

let root;
let orb;
let menu;
let settingsMountAttempts = 0;
let promptStateMap = new Map();
let activeCat = 0;
let dragState = null;

// ── 设备检测与默认定位 ────────────────────────────────────────
function getDefaultPosition() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isMobile = window.innerWidth <= 768 || isIOS || isAndroid;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (isIOS) {
        // iOS: 右下角，避开底部安全区域
        return { x: w - 60, y: h - 100 - (safeAreaInset('bottom') || 0) };
    }
    if (isAndroid) {
        // Android: 右下角
        return { x: w - 60, y: h - 90 };
    }
    if (isMobile) {
        // 其他手机: 右下角
        return { x: w - 60, y: h - 90 };
    }
    // 电脑: 左侧中部
    return { x: 40, y: 160 };
}

function safeAreaInset(side) {
    try {
        const env = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-' + side + ')');
        return parseInt(env, 10) || 0;
    } catch (_) { return 0; }
}

// ── 启动 ──────────────────────────────────────────────────────
function boot() {
    try {
        console.log('[小冰块扩展] boot() 开始执行');
        removeExistingUi();
        injectStyle();
        createPanel();
        mountSettingsPanel();
        applyFloatingEnabled(isFloatingEnabled());
        bindPromptUpdates();
        console.log('[小冰块扩展] boot() 完成，悬浮按钮已注入页面');
    } catch (err) {
        console.error('[小冰块扩展] boot() 失败:', err);
        if (window.toastr?.error) {
            window.toastr.error('小冰块扩展加载失败: ' + (err && err.message || err), '请查看控制台(F12)');
        }
    }
}

// ── 创建面板 ──────────────────────────────────────────────────
function createPanel() {
    root = document.createElement('div');
    root.id = ROOT_ID;

    const pos = loadJson(STORAGE.position, null);
    const def = getDefaultPosition();
    let x = def.x, y = def.y;
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        x = clamp(pos.x, 4, Math.max(4, window.innerWidth - 52));
        y = clamp(pos.y, 4, Math.max(4, window.innerHeight - 52));
    }
    root.style.left = x + 'px';
    root.style.top = y + 'px';

    root.innerHTML =
        '<div class="orb" id="' + ROOT_ID + '-orb">' +
            '<svg class="orb-icon" viewBox="0 0 48 48" width="28" height="28">' +
                '<text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>' +
            '</svg>' +
        '</div>' +
        '<div class="menu" id="' + ROOT_ID + '-menu">' +
            '<div class="menu-shell bg-dark" id="' + ROOT_ID + '-shell">' +
                '<div class="menu-head" id="' + ROOT_ID + '-head">' +
                    '<svg viewBox="0 0 48 48" width="16" height="16">' +
                        '<text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>' +
                    '</svg>' +
                    '<div class="menu-title-wrap"><div class="menu-title">小冰块V3.32双适配版</div></div>' +
                    '<button class="menu-close" id="' + ROOT_ID + '-close">✕</button>' +
                '</div>' +
                '<div class="category-tabs" id="' + ROOT_ID + '-tabs">' +
                    '<div class="category-tab cat-0 active" data-cat="0">通用</div>' +
                    '<div class="category-tab cat-1" data-cat="1">Claude</div>' +
                    '<div class="category-tab cat-2" data-cat="2">Gemini</div>' +
                '</div>' +
                '<div class="menu-list" id="' + ROOT_ID + '-list"></div>' +
                '<div class="menu-foot">' +
                    '<span>小冰块V3.32</span>' +
                    '<span class="fox-link">[ ɪᴄᴇ//ᴄᴜʙᴇ ]</span>' +
                '</div>' +
            '</div>' +
        '</div>';

    document.body.appendChild(root);
    orb = root.querySelector('#' + ROOT_ID + '-orb');
    menu = root.querySelector('#' + ROOT_ID + '-menu');

    bindPanelEvents();
    enableDragging();
    renderList(); // 只在创建时渲染一次
    promptStateMap = new Map(getAllPromptStates().map(function(item) { return [item.identifier, item.enabled]; }));
    syncButtonStates();
    syncAllOnButtons();
}

// ── 渲染列表 ──────────────────────────────────────────────────
function renderList() {
    const listEl = root.querySelector('#' + ROOT_ID + '-list');
    if (!listEl) return;

    const cats = PANEL_DATA;
    let html = '';
    for (let i = 0; i < 3; i++) {
        const display = i === activeCat ? '' : ' style="display:none;"';
        html += '<div class="cat-list cat-list-' + i + '" data-cat="' + i + '"' + display + '>';
        if (i === 1) {
            html += '<div class="grid-toggles col-1" style="padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:2px;">' +
                '<div class="menu-item-toggle btn-full" id="' + ROOT_ID + '-claude-all-on"><div class="menu-item-text">⚡ 一键开启全部Claude</div><div class="toggle-led"></div></div>' +
                '</div>';
        }
        if (i === 2) {
            html += '<div class="grid-toggles col-1" style="padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:2px;">' +
                '<div class="menu-item-toggle btn-full" id="' + ROOT_ID + '-gemini-all-on"><div class="menu-item-text">⚡ 一键开启全部Gemini</div><div class="toggle-led"></div></div>' +
                '</div>';
        }
        html += renderGroups(cats[i]);
        html += '</div>';
    }
    listEl.innerHTML = html;
    syncButtonStates();
    syncAllOnButtons();
}

function renderGroups(groups) {
    let html = '';
    for (const g of groups) {
        html += '<details open><summary>' + escapeHtml(g.t) + '</summary>';
        html += '<div class="details-content">';
        if (g.i && g.i.length > 0) {
            html += '<div class="grid-toggles">' + renderItems(g.i) + '</div>';
        }
        if (g.n && g.n.length > 0) {
            for (const sub of g.n) {
                html += '<details class="nested-details"><summary>' + escapeHtml(sub.t) + '</summary>';
                html += '<div class="details-content">';
                if (sub.i && sub.i.length > 0) {
                    html += '<div class="grid-toggles">' + renderItems(sub.i) + '</div>';
                }
                html += '</div></details>';
            }
        }
        html += '</div></details>';
    }
    return html;
}

function renderItems(items) {
    let html = '';
    for (const item of items) {
        html += '<div class="menu-item-toggle" data-identifier="' + escapeHtml(item.id) + '" title="' + escapeHtml(item.t) + '">' +
            '<div class="menu-item-text">' + escapeHtml(item.t) + '</div>' +
            '<div class="toggle-led"></div></div>';
    }
    return html;
}

// ── 一键开启逻辑 ──────────────────────────────────────────────
function isAllOnActive(buttonId) {
    const btn = root.querySelector('#' + buttonId);
    return btn && btn.classList.contains('is-on');
}

function syncAllOnButtons() {
    if (!root) return;
    const claudeBtn = root.querySelector('#' + ROOT_ID + '-claude-all-on');
    const geminiBtn = root.querySelector('#' + ROOT_ID + '-gemini-all-on');
    // 检查是否所有非跳过的Claude条目都开着
    if (claudeBtn) {
        const allClaudeOn = ALL_CLAUDE_IDS.filter(id => !CLAUDE_SKIP_IDS.includes(id)).every(id => promptStateMap.get(id) === true);
        claudeBtn.classList.toggle('is-on', allClaudeOn);
    }
    if (geminiBtn) {
        const allGeminiOn = ALL_GEMINI_IDS.filter(id => !GEMINI_SKIP_IDS.includes(id)).every(id => promptStateMap.get(id) === true);
        geminiBtn.classList.toggle('is-on', allGeminiOn);
    }
}

function handleClaudeAllOn() {
    const btn = root.querySelector('#' + ROOT_ID + '-claude-all-on');
    if (!btn) return;
    const turnOn = !btn.classList.contains('is-on');

    if (turnOn) {
        // 开启所有Claude（跳过暗黑森林和小克破限）
        ALL_CLAUDE_IDS.forEach(function(id) {
            if (!CLAUDE_SKIP_IDS.includes(id)) setPromptEnabled(id, true);
        });
        // 关闭所有Gemini
        ALL_GEMINI_IDS.forEach(function(id) { setPromptEnabled(id, false); });
    } else {
        // 关闭所有Claude（跳过暗黑森林和小克破限）
        ALL_CLAUDE_IDS.forEach(function(id) {
            if (!CLAUDE_SKIP_IDS.includes(id)) setPromptEnabled(id, false);
        });
    }
    setTimeout(function() {
        promptStateMap = new Map(getAllPromptStates().map(function(item) { return [item.identifier, item.enabled]; }));
        syncButtonStates();
        syncAllOnButtons();
    }, 120);
}

function handleGeminiAllOn() {
    const btn = root.querySelector('#' + ROOT_ID + '-gemini-all-on');
    if (!btn) return;
    const turnOn = !btn.classList.contains('is-on');

    if (turnOn) {
        // 开启所有Gemini（跳过指定条目）
        ALL_GEMINI_IDS.forEach(function(id) {
            if (!GEMINI_SKIP_IDS.includes(id)) setPromptEnabled(id, true);
        });
        // 关闭所有Claude
        ALL_CLAUDE_IDS.forEach(function(id) { setPromptEnabled(id, false); });
    } else {
        // 关闭所有Gemini（跳过指定条目）
        ALL_GEMINI_IDS.forEach(function(id) {
            if (!GEMINI_SKIP_IDS.includes(id)) setPromptEnabled(id, false);
        });
    }
    setTimeout(function() {
        promptStateMap = new Map(getAllPromptStates().map(function(item) { return [item.identifier, item.enabled]; }));
        syncButtonStates();
        syncAllOnButtons();
    }, 120);
}

// ── 状态同步（不重新渲染，只更新CSS类） ──────────────────────
function refreshPanel() {
    promptStateMap = new Map(getAllPromptStates().map(function(item) { return [item.identifier, item.enabled]; }));
    syncButtonStates();
    syncAllOnButtons();
}

function syncButtonStates() {
    if (!root) return;
    root.querySelectorAll('.menu-item-toggle[data-identifier]').forEach(function(btn) {
        const id = btn.dataset.identifier;
        const on = promptStateMap.has(id) ? promptStateMap.get(id) : false;
        btn.classList.toggle('is-on', on);
    });
}

// ── 设置面板 ──────────────────────────────────────────────────
function mountSettingsPanel() {
    const host = document.querySelector('#extensions_settings')
        || document.querySelector('#extensions_settings2')
        || document.querySelector('#extensions-settings')
        || document.querySelector('.extensions_settings');

    if (!host) {
        if (settingsMountAttempts < 20) {
            settingsMountAttempts += 1;
            setTimeout(mountSettingsPanel, 250);
        }
        return;
    }

    const panel = document.createElement('div');
    panel.id = SETTINGS_ID;
    panel.className = 'xbk-settings-block inline-drawer';
    panel.innerHTML =
        '<div class="inline-drawer-toggle inline-drawer-header xbk-drawer-header">' +
            '<b>❄️ 小冰块V3.32双适配版</b>' +
            '<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>' +
        '</div>' +
        '<div class="inline-drawer-content" style="display:none;">' +
            '<div class="xbk-settings-hint">只控制本插件自己的悬浮按钮，与酒馆助手悬浮窗无绑定。</div>' +
            '<label class="checkbox_label xbk-settings-row" for="xbk-enable-floating">' +
                '<input id="xbk-enable-floating" type="checkbox" /><span>开启悬浮窗</span>' +
            '</label>' +
        '</div>';
    host.appendChild(panel);

    const checkbox = panel.querySelector('#xbk-enable-floating');
    checkbox.checked = isFloatingEnabled();
    checkbox.addEventListener('change', function() {
        setFloatingEnabled(checkbox.checked);
    });
}

// ── 清理 ──────────────────────────────────────────────────────
function removeExistingUi() {
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(SETTINGS_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    root = null; orb = null; menu = null;
}

// ── 事件绑定 ──────────────────────────────────────────────────
function bindPanelEvents() {
    root.querySelector('#' + ROOT_ID + '-close').addEventListener('click', function(e) {
        e.stopPropagation(); closeMenu();
    });

    root.querySelector('#' + ROOT_ID + '-tabs').addEventListener('click', function(e) {
        const tab = e.target.closest('.category-tab');
        if (!tab) return;
        activeCat = Number(tab.dataset.cat);
        root.querySelectorAll('.category-tab').forEach(function(t) { t.classList.toggle('active', t === tab); });
        root.querySelectorAll('.cat-list').forEach(function(cl) {
            cl.style.display = Number(cl.dataset.cat) === activeCat ? '' : 'none';
        });
    });

    root.addEventListener('click', function(e) {
        // 一键开启按钮
        if (e.target.closest('#' + ROOT_ID + '-claude-all-on')) {
            e.stopPropagation();
            handleClaudeAllOn();
            return;
        }
        if (e.target.closest('#' + ROOT_ID + '-gemini-all-on')) {
            e.stopPropagation();
            handleGeminiAllOn();
            return;
        }
        // 普通条目切换
        const btn = e.target.closest('.menu-item-toggle[data-identifier]');
        if (!btn) return;
        const id = btn.dataset.identifier;
        if (!id) return;
        const ok = togglePrompt(id);
        if (!ok) {
            if (window.toastr?.warning) window.toastr.warning('没有找到这个预设条目');
            return;
        }
        btn.classList.toggle('is-on');
        var newEnabled = btn.classList.contains('is-on');
        promptStateMap.set(id, newEnabled);
        // nsfw-suppress互斥：防止发情开启时，关闭同组其他所有NSFW条目
        if (id === NSFW_SUPPRESS_ID && newEnabled) {
            NSFW_SECTION_IDS.forEach(function(nsid) {
                if (nsid !== NSFW_SUPPRESS_ID) {
                    setPromptEnabled(nsid, false);
                    promptStateMap.set(nsid, false);
                    var nsfwBtn = root.querySelector('.menu-item-toggle[data-identifier="' + nsid + '"]');
                    if (nsfwBtn) nsfwBtn.classList.remove('is-on');
                }
            });
        }
        syncAllOnButtons();
    });
}

function bindPromptUpdates() {
    onPromptStateChanged(function(states) {
        promptStateMap = new Map(states.map(function(item) { return [item.identifier, item.enabled]; }));
        syncButtonStates();
        syncAllOnButtons();
    });
}

// ── 开关控制 ──────────────────────────────────────────────────
function isFloatingEnabled() {
    return localStorage.getItem(STORAGE.enabled) !== 'false';
}

function setFloatingEnabled(enabled) {
    localStorage.setItem(STORAGE.enabled, String(enabled));
    const checkbox = document.querySelector('#xbk-enable-floating');
    if (checkbox) checkbox.checked = enabled;
    applyFloatingEnabled(enabled);
    // 不自动展开面板，只显示/隐藏按钮
}

function applyFloatingEnabled(enabled) {
    if (!root) return;
    root.style.display = enabled ? '' : 'none';
    if (!enabled) closeMenu();
    if (enabled) { syncButtonStates(); syncAllOnButtons(); }
}

// ── 面板开关 ──────────────────────────────────────────────────
function toggleMenu() {
    if (root.classList.contains(CLASS.open)) closeMenu();
    else openMenu();
}

function openMenu() {
    if (!root) return;
    updateMenuDirection();
    root.classList.add(CLASS.open);
    // 只同步状态，不重新渲染（避免分组关闭和卡顿）
    promptStateMap = new Map(getAllPromptStates().map(function(item) { return [item.identifier, item.enabled]; }));
    syncButtonStates();
    syncAllOnButtons();
    setTimeout(function() {
        root.querySelectorAll('.cat-list details').forEach(function(d) { d.open = true; });
    }, 80);
}

function closeMenu() {
    if (!root) return;
    root.classList.remove(CLASS.open);
    root.classList.remove(CLASS.openUp);
}

function updateMenuDirection() {
    const orbX = parseInt(root.style.left, 10) || 0;
    const orbY = parseInt(root.style.top, 10) || 0;
    const menuH = 480;
    if (orbX < window.innerWidth / 2) { menu.style.left = '0'; menu.style.right = 'auto'; }
    else { menu.style.left = 'auto'; menu.style.right = '0'; }
    const spaceBelow = window.innerHeight - orbY - 60;
    if (spaceBelow < menuH && orbY > menuH / 2) {
        menu.style.top = 'auto'; menu.style.bottom = '52px';
        root.classList.add(CLASS.openUp);
        menu.style.transformOrigin = orbX < window.innerWidth / 2 ? 'bottom left' : 'bottom right';
    } else {
        menu.style.top = '52px'; menu.style.bottom = 'auto';
        root.classList.remove(CLASS.openUp);
        menu.style.transformOrigin = orbX < window.innerWidth / 2 ? 'top left' : 'top right';
    }
}

// ── 拖拽 ──────────────────────────────────────────────────────
function enableDragging() {
    const head = root.querySelector('#' + ROOT_ID + '-head');
    const DRAG_THRESHOLD = 4;
    let dragMask = null;

    function createMask() {
        dragMask?.remove();
        dragMask = document.createElement('div');
        dragMask.id = ROOT_ID + '-drag-mask';
        dragMask.style.cssText = 'position:fixed;inset:0;z-index:2147483639;cursor:grabbing;background:transparent;';
        document.body.appendChild(dragMask);
    }
    function removeMask() { dragMask?.remove(); dragMask = null; }
    function startDrag(cx, cy) {
        dragState = { moved: false, sx: cx, sy: cy };
        const rect = root.getBoundingClientRect();
        dragState.ox = cx - rect.left; dragState.oy = cy - rect.top;
        root.style.transition = 'none'; createMask();
    }
    function moveDrag(cx, cy) {
        if (!dragState) return;
        if (!dragState.moved && Math.abs(cx - dragState.sx) < DRAG_THRESHOLD && Math.abs(cy - dragState.sy) < DRAG_THRESHOLD) return;
        dragState.moved = true;
        root.style.left = Math.max(4, Math.min(cx - dragState.ox, window.innerWidth - 50)) + 'px';
        root.style.top = Math.max(4, Math.min(cy - dragState.oy, window.innerHeight - 50)) + 'px';
    }
    function endDrag() {
        if (!dragState) return;
        root.style.transition = ''; removeMask();
        if (dragState.moved) savePos();
        dragState = null;
    }
    function isInteractive(e) {
        return e.target.id === ROOT_ID + '-close'
            || e.target.closest('.menu-item-toggle')
            || e.target.closest('.category-tab');
    }

    orb.addEventListener('mousedown', function(e) { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    head.addEventListener('mousedown', function(e) { if (isInteractive(e)) return; startDrag(e.clientX, e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', function(e) { moveDrag(e.clientX, e.clientY); });
    document.addEventListener('mouseup', endDrag);
    orb.addEventListener('click', function() { if (dragState && dragState.moved) return; toggleMenu(); });

    orb.addEventListener('touchstart', function(e) { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.stopPropagation(); }, { passive: true });
    orb.addEventListener('touchmove', function(e) { if (!dragState) return; moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    orb.addEventListener('touchend', function(e) { var w = dragState && dragState.moved; endDrag(); if (!w) toggleMenu(); e.stopPropagation(); e.preventDefault(); }, { passive: false });
    head.addEventListener('touchstart', function(e) { if (isInteractive(e)) return; startDrag(e.touches[0].clientX, e.touches[0].clientY); e.stopPropagation(); }, { passive: true });
    head.addEventListener('touchmove', function(e) { if (!dragState) return; moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    head.addEventListener('touchend', function(e) { endDrag(); e.stopPropagation(); }, { passive: false });
}

function savePos() {
    localStorage.setItem(STORAGE.position, JSON.stringify({ x: parseInt(root.style.left, 10) || 0, y: parseInt(root.style.top, 10) || 0 }));
}

// ── 工具 ──────────────────────────────────────────────────────
function loadJson(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (_) { return fallback; } }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, function(c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }

// ── 样式表 ────────────────────────────────────────────────────
function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
'#' + ROOT_ID + ' {',
'    position: fixed !important; z-index: 2147483647 !important;',
'    width: 48px; height: 48px;',
'    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;',
'    user-select: none; -webkit-user-select: none; touch-action: none;',
'    -webkit-transform: translateZ(0); transform: translateZ(0);',
'}',
'@keyframes xbk-orbBreathe {',
'    0%, 100% { text-shadow: 0 0 4px rgba(217,119,87,0.3), 0 0 8px rgba(96,185,200,0.15), 0 0 14px rgba(217,119,87,0.08); }',
'    50% { text-shadow: 0 0 8px rgba(217,119,87,0.45), 0 0 16px rgba(96,185,200,0.25), 0 0 24px rgba(217,119,87,0.12); }',
'}',
'#' + ROOT_ID + ' .orb { position: absolute; top: 0; left: 0; width: 48px; height: 48px; border-radius: 8px; cursor: pointer; z-index: 2; background: transparent; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; }',
'#' + ROOT_ID + ' .orb:hover { background: rgba(255,255,255,0.05); }',
'#' + ROOT_ID + ' .orb-icon { transition: transform 0.3s ease-out; display: block; animation: xbk-orbBreathe 2.5s ease-in-out infinite; }',
'#' + ROOT_ID + ' .orb:hover .orb-icon { transform: scale(1.12); }',
'#' + ROOT_ID + '.open .orb-icon { transform: rotate(90deg); }',
'#' + ROOT_ID + ' .menu { position: absolute; width: 340px; pointer-events: none; transform: translateY(-6px); opacity: 0; transition: transform 0.18s ease-out, opacity 0.15s ease; }',
'@media (max-width: 768px) { #' + ROOT_ID + ' .menu { width: calc(100vw - 24px); max-width: 340px; } }',
'#' + ROOT_ID + '.open .menu { pointer-events: all; transform: translateY(0); opacity: 1; }',
'#' + ROOT_ID + '.open-up .menu { transform: translateY(6px); }',
'#' + ROOT_ID + '.open.open-up .menu { transform: translateY(0); }',
'#' + ROOT_ID + ' .menu-shell { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05); background: rgba(22,22,22,0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); position: relative; }',
'#' + ROOT_ID + ' .menu-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.06); cursor: grab; flex-shrink: 0; }',
'#' + ROOT_ID + ' .menu-head:active { cursor: grabbing; }',
'#' + ROOT_ID + ' .menu-title-wrap { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }',
'#' + ROOT_ID + ' .menu-title { font-size: 13px; font-weight: bold; color: #eeeeee; letter-spacing: 0.05em; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }',
'#' + ROOT_ID + ' .menu-close { width: 22px; height: 22px; border-radius: 4px; border: none; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.15s; padding: 0; }',
'#' + ROOT_ID + ' .menu-close:hover { background: rgba(255,255,255,0.1); color: #fff; }',
'#' + ROOT_ID + ' .category-tabs { display: flex; gap: 0; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.12); flex-shrink: 0; }',
'#' + ROOT_ID + ' .category-tab { flex: 1; text-align: center; padding: 5px 0; font-size: 11px; cursor: pointer; border-radius: 5px; transition: all 0.18s; color: rgba(255,255,255,0.4); font-weight: 500; margin: 0 2px; user-select: none; }',
'#' + ROOT_ID + ' .category-tab:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }',
'#' + ROOT_ID + ' .category-tab.cat-1:hover { background: rgba(64,140,255,0.1); color: #6db3ff; }',
'#' + ROOT_ID + ' .category-tab.cat-2:hover { background: rgba(230,60,60,0.1); color: #ff7070; }',
'#' + ROOT_ID + ' .category-tab.active { font-weight: 700; }',
'#' + ROOT_ID + ' .category-tab.cat-0.active { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.95); }',
'#' + ROOT_ID + ' .category-tab.cat-1.active { background: rgba(40,120,255,0.22); color: #4d9fff; }',
'#' + ROOT_ID + ' .category-tab.cat-2.active { background: rgba(220,40,40,0.22); color: #ff6b6b; }',
'#' + ROOT_ID + ' .menu-list { padding: 8px 8px 52px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; max-height: 65vh; }',
'@media (max-width: 768px) { #' + ROOT_ID + ' .menu-list { max-height: 55vh; } }',
'#' + ROOT_ID + ' .menu-list::-webkit-scrollbar { width: 4px; }',
'#' + ROOT_ID + ' .menu-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }',
'#' + ROOT_ID + ' details { margin-bottom: 2px; }',
'#' + ROOT_ID + ' summary { font-size: 11.5px; font-weight: bold; color: rgba(255,255,255,0.8); padding: 8px 10px; background: rgba(0,0,0,0.15); border-radius: 6px; cursor: pointer; list-style: none; user-select: none; display: flex; justify-content: space-between; align-items: center; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s; }',
'#' + ROOT_ID + ' summary:hover { background: rgba(255,255,255,0.05); }',
'#' + ROOT_ID + ' summary::after { content: "▼"; font-size: 9px; opacity: 0.5; transition: transform 0.2s; }',
'#' + ROOT_ID + ' details[open] > summary::after { transform: rotate(180deg); }',
'#' + ROOT_ID + ' .details-content { padding: 8px 0 4px 0; display: flex; flex-direction: column; gap: 6px; }',
'#' + ROOT_ID + ' .nested-details { margin-left: 4px; border-left: 2px solid rgba(255,255,255,0.08); padding-left: 6px; margin-bottom: 4px; }',
'#' + ROOT_ID + ' .nested-details summary { background: rgba(255,255,255,0.06); font-size: 10.5px; color: rgba(255,255,255,0.7); padding: 6px 10px; border-radius: 4px; }',
'#' + ROOT_ID + ' .nested-details summary:hover { background: rgba(255,255,255,0.12); }',
'#' + ROOT_ID + ' .nested-details .details-content { padding: 6px 0 4px 4px; }',
'.grid-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px; }',
'.grid-toggles.col-1 { grid-template-columns: 1fr; }',
'#' + ROOT_ID + ' .toggle-led { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.15); transition: background 0.2s ease, box-shadow 0.2s ease; border: 1px solid rgba(0,0,0,0.5); margin-left: 6px; align-self: center; }',
'#' + ROOT_ID + ' .menu-item-toggle { display: flex; align-items: center; justify-content: space-between; min-height: 32px; padding: 5px 8px; border-radius: 6px; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; margin: 0; }',
'#' + ROOT_ID + ' .menu-item-toggle:hover { background: rgba(255,255,255,0.08); }',
'#' + ROOT_ID + ' .menu-item-text { font-size: 11px; color: rgba(255,255,255,0.7); white-space: normal; word-break: break-word; line-height: 1.25; margin-top: 0; flex: 1; min-width: 0; }',
'#' + ROOT_ID + ' .menu-item-toggle.is-on { background: rgba(96,185,200,0.15); border-color: rgba(96,185,200,0.4); }',
'#' + ROOT_ID + ' .menu-item-toggle.is-on .menu-item-text { color: #ffffff; }',
'#' + ROOT_ID + ' .menu-item-toggle.is-on .toggle-led { background: #60b9c8; box-shadow: 0 0 6px #60b9c8; border-color: transparent; }',
'#' + ROOT_ID + ' .btn-full { grid-column: 1 / -1; justify-content: center; background: rgba(232,176,114,0.05); gap: 6px; border-color: rgba(232,176,114,0.2); }',
'#' + ROOT_ID + ' .btn-full .menu-item-text { font-size: 13px; font-weight: bold; color: #e8b072; text-align: center; }',
'#' + ROOT_ID + ' .btn-full.is-on { background: rgba(232,176,114,0.2); border-color: rgba(232,176,114,0.5); }',
'#' + ROOT_ID + ' .btn-full.is-on .menu-item-text { color: #ffd6a5; }',
'#' + ROOT_ID + ' .btn-full.is-on .toggle-led { background: #e8b072; box-shadow: 0 0 6px #e8b072; border-color: transparent; }',
'#' + ROOT_ID + ' .menu-foot { position: absolute; bottom: 0; left: 0; right: 0; z-index: 5; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px 13px; font-size: 10px; color: rgba(255,255,255,0.5); background: rgba(0,0,0,0.88); pointer-events: none; letter-spacing: 0.04em; }',
'#' + ROOT_ID + ' .fox-link { cursor: pointer; color: rgba(96,185,200,0.6); font-weight: bold; letter-spacing: 0.5px; transition: color 0.2s ease; font-size: 10px; }',
'#' + ROOT_ID + ' .fox-link:hover { color: #e8b072; text-shadow: 0 0 8px rgba(232,176,114,0.8); }',
'@keyframes xbk-orb-in { from { opacity:0; } to { opacity:1; } }',
'#' + ROOT_ID + ' { animation: xbk-orb-in 0.2s ease-out both; }',
'#' + SETTINGS_ID + ' { margin: 10px 0; }',
'#' + SETTINGS_ID + ' .xbk-drawer-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; }',
'#' + SETTINGS_ID + ' .xbk-drawer-header b { color: var(--SmartThemeBodyColor, inherit); }',
'#' + SETTINGS_ID + ' .xbk-settings-hint { margin-bottom: 8px; color: var(--SmartThemeBodyColor, inherit); opacity: 0.65; font-size: 0.85em; }',
'#' + SETTINGS_ID + ' .xbk-settings-row { display: flex; align-items: center; gap: 8px; width: fit-content; margin: 4px 0; cursor: pointer; }',
'#' + SETTINGS_ID + ' .xbk-settings-row input { margin: 0; }',
    ].join('\n');
    document.head.appendChild(style);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
