#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
出生图报告 V3.3 预计算模块
功能：接收星盘数据（行星落点/宫位/相位），输出结构化JSON供大模型使用
所有查表、计算、模板填充都在此完成，大模型只需做"文案创作"部分

输入：chart_data 字典（来自 birth_report_sweph.py 或外部输入）
输出：precomputed JSON 字典
"""
import math, json, re
from datetime import datetime

# ============================================================
# 第一部分：固定查表字典（零逻辑，纯映射）
# ============================================================

# 1.1 现代占星守护星表
# PRISM报告采用现代占星宫主标准：天蝎=冥王星，水瓶=天王星，双鱼=海王星。
# 注意：庙旺落陷仍主要按传统七政体系判断，外行星暂不做庙旺落陷加减。
RULERS = {
    "白羊":"火星","金牛":"金星","双子":"水星","巨蟹":"月亮","狮子":"太阳",
    "处女":"水星","天秤":"金星","天蝎":"冥王星","射手":"木星","摩羯":"土星",
    "水瓶":"天王星","双鱼":"海王星"
}

# 1.2 庙旺落陷表（7颗个人行星×12星座）
DIGNITY_MAP = {
    "太阳": {"狮子":"入庙","白羊":"入旺","天秤":"落陷","水瓶":"失势"},
    "月亮": {"巨蟹":"入庙","金牛":"入旺","天蝎":"落陷","摩羯":"失势"},
    "水星": {"双子":"入庙","处女":"入庙","处女":"入旺","射手":"失势","双鱼":"失势","双鱼":"落陷"},
    "金星": {"金牛":"入庙","天秤":"入庙","双鱼":"入旺","天蝎":"失势","白羊":"失势","处女":"落陷"},
    "火星": {"白羊":"入庙","天蝎":"入庙","摩羯":"入旺","天秤":"失势","金牛":"失势","巨蟹":"落陷"},
    "木星": {"射手":"入庙","双鱼":"入庙","巨蟹":"入旺","双子":"失势","处女":"失势","摩羯":"落陷"},
    "土星": {"摩羯":"入庙","水瓶":"入庙","天秤":"入旺","巨蟹":"失势","狮子":"失势","白羊":"落陷"},
}
# 修正：水星/金星/火星/木星/土星有双入庙星座，用列表形式重写
DIGNITY_MAP_V2 = {
    "太阳": {"入庙":["狮子"],"入旺":["白羊"],"失势":["水瓶"],"落陷":["天秤"]},
    "月亮": {"入庙":["巨蟹"],"入旺":["金牛"],"失势":["摩羯"],"落陷":["天蝎"]},
    "水星": {"入庙":["双子","处女"],"入旺":["处女"],"失势":["射手","双鱼"],"落陷":["双鱼"]},
    "金星": {"入庙":["金牛","天秤"],"入旺":["双鱼"],"失势":["天蝎","白羊"],"落陷":["处女"]},
    "火星": {"入庙":["白羊","天蝎"],"入旺":["摩羯"],"失势":["天秤","金牛"],"落陷":["巨蟹"]},
    "木星": {"入庙":["射手","双鱼"],"入旺":["巨蟹"],"失势":["双子","处女"],"落陷":["摩羯"]},
    "土星": {"入庙":["摩羯","水瓶"],"入旺":["天秤"],"失势":["巨蟹","狮子"],"落陷":["白羊"]},
}

# 1.3 行星基础分
PLANET_BASE = {
    "太阳":65,"月亮":61,"金星":57,"水星":53,"木星":51,"土星":50,
    "火星":47,"天王星":43,"海王星":42,"冥王星":41
}

# 1.4 行星本质定义（0.6红线规则）
PLANET_NATURE = {
    "太阳":"自我实现、核心使命、领导力、身份认同、创造力、生命力、尊严",
    "月亮":"情绪感知、滋养保护、安全感、归属感、直觉、情感需求、母性",
    "水星":"思维逻辑、沟通表达、信息处理、学习能力、连接、表达、分析",
    "金星":"审美价值、关系联结、金钱资源、享受、爱、美、平衡、价值观",
    "火星":"行动突破、执行力、勇气、竞争力、欲望、战斗力、initiative",
    "木星":"扩张成长、幸运机会、智慧信仰、乐观、abundance、成长、远方",
    "土星":"结构责任、限制边界、沉淀积累、成熟、discipline、规则、压力",
    "天王星":"创新变革、叛逆独立、突发变化、自由、颠覆、科技、独特",
    "海王星":"想象灵性、模糊消融、慈悲包容、梦幻、艺术、疗愈、欺骗",
    "冥王星":"深度转化、毁灭重生、权力控制、极致、蜕变、深度、重生"
}

# 1.5 行星人定义（封面用）
PLANET_PERSON = {
    "太阳":"以自我实现为核心驱动力，天生要活出自己的方向和影响力",
    "月亮":"以情感感知为导航，能捕捉别人没说出口的真实需求",
    "水星":"以思维和表达为引擎，能把复杂信息变成清晰方案",
    "金星":"以价值和关系为判断标准，能在混乱中找到值得投入的东西",
    "火星":"以行动力为先锋，能在别人犹豫时快速出手",
    "木星":"以远见和扩张为本能，总能看到更大的机会",
    "土星":"以秩序和耐力为根基，能把不确定的事做成确定成果",
    "天王星":"以创新和突破为使命，能在旧规则中找到新解法",
    "海王星":"以共情和想象力为天赋，能感知到别人忽略的隐性层面",
    "冥王星":"以深度和转化为天赋，能在危机里找到重生力量"
}

# 1.6 TOP1+TOP2→组合角色名映射（45种）
ROLE_MAP = {
    ("太阳","月亮"):"内心指挥官",("太阳","水星"):"思想战略家",("太阳","金星"):"价值锻造师",
    ("太阳","火星"):"行动指挥官",("太阳","木星"):"远见领航员",("太阳","土星"):"基业建筑师",
    ("太阳","天王星"):"未来架构师",("太阳","海王星"):"理想布道师",("太阳","冥王星"):"权力锻造师",
    ("月亮","水星"):"情绪翻译官",("月亮","金星"):"关系调音师",("月亮","火星"):"情感急救员",
    ("月亮","木星"):"心灵导师",("月亮","土星"):"安全建筑师",("月亮","天王星"):"情绪破壁人",
    ("月亮","海王星"):"灵魂疗愈师",("月亮","冥王星"):"深渊勘探员",
    ("水星","金星"):"创意策展人",("水星","火星"):"突击策划师",("水星","木星"):"全局战略师",
    ("水星","土星"):"体系架构师",("水星","天王星"):"认知破壁人",("水星","海王星"):"灵感翻译官",
    ("水星","冥王星"):"真相调查官",
    ("金星","火星"):"吸引力工程师",("金星","木星"):"财富策展人",("金星","土星"):"经典铸造师",
    ("金星","天王星"):"审美革命者",("金星","海王星"):"梦境设计师",("金星","冥王星"):"关系炼金师",
    ("火星","木星"):"远征先锋官",("火星","土星"):"铁血建造师",("火星","天王星"):"破局突击手",
    ("火星","海王星"):"信仰战士",("火星","冥王星"):"重生锻造师",
    ("木星","土星"):"格局建筑师",("木星","天王星"):"未来预言家",("木星","海王星"):"信念领航员",
    ("木星","冥王星"):"资源炼金师",
    ("土星","天王星"):"秩序革命者",("土星","海王星"):"理想建筑师",("土星","冥王星"):"权力建筑师",
    ("天王星","海王星"):"未来造梦师",("天王星","冥王星"):"系统重构师",
    ("海王星","冥王星"):"灵魂炼金师"
}

# 1.7 行业建议库
INDUSTRY_MAP = {
    "太阳":["个人品牌","团队管理","教育培训","创业孵化","活动策划","公共表达"],
    "月亮":["用户研究","客户关系","情绪陪伴","社群运营","照护服务","关系协调"],
    "水星":["内容策划","课程研发","知识付费","编辑写作","短视频脚本","咨询顾问"],
    "金星":["品牌审美","空间美学","生活方式产品","关系服务","高端体验消费","长期客户价值管理"],
    "火星":["销售BD","项目推进","创业执行","运动健身","危机处理","增长运营"],
    "木星":["战略咨询","课程体系","出版传播","跨界资源整合","教育培训"],
    "土星":["企业咨询","管理体系","财务法务","长期项目","组织建设","传统行业升级"],
    "天王星":["AI应用","创新产品","科技内容","独立品牌","系统改造","流程自动化"],
    "海王星":["艺术创作","影像音乐","疗愈内容","冥想引导","公益项目","灵感型创作"],
    "冥王星":["深度咨询","危机干预","调查研究","投资研究","转型辅导","心理洞察"]
}
INDUSTRY_COMBO = {
    ("水星","月亮"):["用户研究","情绪型内容策划","社群沟通顾问","课程转译"],
    ("水星","太阳"):["知识IP","课程主理人","内容战略顾问","教育产品负责人"],
    ("水星","金星"):["创意策展","内容产品包装","高端课程设计","品牌表达顾问"],
    ("金星","土星"):["高端品牌管理","空间美学标准化","长期客户关系管理"],
    ("火星","木星"):["增长负责人","销售培训","创业项目推进","市场拓展"],
    ("冥王星","水星"):["深度访谈","商业调查","心理洞察内容","危机公关分析"],
}

# 1.8 法达互补人物表
FIRDARIA_PARTNER = {
    "太阳":"木星型——鼓励你放大格局、敢想敢做的人",
    "月亮":"土星型——帮你落地执行、把感受变成行动的人",
    "水星":"木星型——帮你从细节跳到全局的人",
    "金星":"火星型——推你从权衡走向行动的人",
    "火星":"金星型——帮你从冲撞转向合作的人",
    "木星":"土星型——帮你从扩张回到聚焦的人",
    "土星":"木星型——帮你在压力里看到可能性的人"
}

# 1.9 法达序列
FIRDARIA_DAY = [(0,10,"太阳"),(10,19,"金星"),(19,31,"水星"),(31,40,"月亮"),(40,51,"土星"),(51,63,"木星"),(63,70,"火星")]
FIRDARIA_NIGHT = [(0,9,"月亮"),(9,20,"土星"),(20,31,"木星"),(31,40,"火星"),(40,51,"太阳"),(51,62,"金星"),(62,75,"水星")]

# 1.10 宫位关键词翻译表（金钥匙行动+法达落宫事件共用）
HOUSE_KEYWORDS = {
    1:"自我重塑、形象变化、身份转换、独立决策",
    2:"收入、定价、资产、自我价值、钱的稳定性",
    3:"学习、表达、写作、短内容、课程、沟通、销售话术",
    4:"家庭、居住、根基、房子、私人空间、内在安全感、长期根据地",
    5:"恋爱、玩乐、创作、作品、舞台、子女、娱乐消费、曝光机会",
    6:"工作流程、健康、作息、服务、技能、同事、执行细节、身体反馈",
    7:"婚姻、合作、客户、合伙、谈判、公开关系、一对一绑定",
    8:"投资、债务、保险、偏财、深层关系、信任、危机、心理转化",
    9:"远方、进修、出版、课程、法律、信念、跨界传播、高阶知识",
    10:"事业名声、职位、权威、公众身份、上级、职业成就、社会评价",
    11:"社群、人脉、组织、平台、粉丝、团队资源、长期目标",
    12:"幕后沉淀、疗愈、艺术、公益、隐性资源、独处修复"
}

# 1.11 宫位简短场景词（用于飞宫锚点描述）
HOUSE_SCENE = {
    1:"自我展现",2:"资源变现",3:"学习沟通",4:"根基家庭",5:"创作表达",
    6:"日常工作",7:"一对一合作",8:"深度资源",9:"远见探索",10:"事业名声",
    11:"社群圈子",12:"灵性超越"
}

# 1.12 宫位权重（行星评分用）
HOUSE_WEIGHT = {1:10,10:9,7:9,4:9,2:4,5:4,8:4,11:4,3:-2,6:-2,9:-2,12:-2}

# 1.13 宫位类型
HOUSE_TYPE = {
    1:"角宫",4:"角宫",7:"角宫",10:"角宫",
    2:"续宫",5:"续宫",8:"续宫",11:"续宫",
    3:"果宫",6:"果宫",9:"果宫",12:"果宫"
}

# 1.14 星座元素
SIGN_ELEMENT = {
    "白羊":"火","金牛":"土","双子":"风","巨蟹":"水","狮子":"火","处女":"土",
    "天秤":"风","天蝎":"水","射手":"火","摩羯":"土","水瓶":"风","双鱼":"水"
}

# 1.15 星座风格描述（用于天赋三层合一的第二层）
SIGN_STYLE = {
    "白羊":"直接、快速、开创、不犹豫、先做再说",
    "金牛":"稳定、务实、感官、慢热、坚持到底",
    "双子":"灵活、多元、好奇、信息型、同时处理多件事",
    "巨蟹":"敏感、保护、情感驱动、家庭导向、记忆型",
    "狮子":"自信、表达、舞台感、领导型、需要被看见",
    "处女":"精细、分析、服务、流程型、追求完美",
    "天秤":"平衡、关系、审美、协调型、追求和谐",
    "天蝎":"深度、洞察、控制、转化型、不达目的不罢休",
    "射手":"远见、自由、信念、探索型、追求意义",
    "摩羯":"结构、耐力、目标、长期主义、用时间证明",
    "水瓶":"独立、反传统、创新、群体型、追求独特",
    "双鱼":"共情、想象、灵性、消融边界、直觉型"
}

# 1.16 偏财8飞X风险提示
RISK_8FLY = {
    1:"因个人冲动、身份变化、自我判断带来的资源风险",
    2:"金钱、定价、资产、消费、现金流风险",
    3:"合同、沟通、学习、短期信息差风险",
    4:"家庭、房产、长期安全感、亲密信任风险",
    5:"恋爱、玩乐、创作、投机、兴趣副业、娱乐消费、创意合伙风险",
    6:"工作、健康、流程、下属、服务交付风险",
    7:"伴侣、客户、合伙、一对一绑定风险",
    8:"投资、债务、深层绑定、危机转化风险",
    9:"远方、课程、法律、出版、信念风险",
    10:"事业名声、职位、权威、公众风险",
    11:"社群、平台、人脉、组织资源风险",
    12:"隐性资源、幕后、疗愈、孤立、不可见损耗风险"
}

# 1.17 6宫主硬相位→健康报警模板
HEALTH_SIGNAL = {
    "刑冲火星":"你最怕急性发作——炎症、发烧、突发性伤害。身体一旦发出信号，不要硬扛，立刻处理",
    "刑冲土星":"你最怕慢性积累——骨骼、关节、牙齿、长期劳损。问题是慢慢磨出来的，等你感觉到了往往已经很严重",
    "刑冲海王":"你最怕误诊和忽视——过敏、免疫系统、隐性病症。身体说不舒服的时候，不要自己猜，去查清楚",
    "刑冲冥王":"你需要警惕深度健康问题——不是吓你，而是你的盘面显示小问题可能被忽视直到变成大问题。定期体检不是选做，是必做"
}

# 1.18 7宫主硬相位→婚姻危机模板
MARRIAGE_CRISIS = {
    "落陷失势":"你在婚姻关系中容易感到不满足或不安，核心问题不是对方不够好，而是{reason}",
    "刑冲火星":"婚姻中最怕激烈冲突升级，你需要学会降温，否则冲突会从口角变成不可修复的裂痕",
    "刑冲冥王":"婚姻中最怕权力斗争和信任危机，你需要警惕控制欲，否则关系会进入'谁控制谁'的死循环",
    "刑冲海王":"婚姻中最怕自欺欺人和边界模糊，你需要警惕过度牺牲，否则你会在关系中不断失去自己直到崩溃",
    "刑冲土星":"婚姻中最怕冷漠和压抑，你需要警惕把婚姻变成任务，否则关系会越来越像室友而不是伴侣"
}

# 1.19 破财风险信号库
FINANCIAL_RISK_SIGNALS = {
    "2宫主落陷":"定价混乱、收入不稳、被关系消耗",
    "2宫主失势":"自我价值感低、不敢定价、容易贱卖能力",
    "8宫主刑冲火星":"冲动投资、投机亏损、合伙被骗",
    "8宫主刑冲冥王":"权力绑定、深层控制、资源被暗耗",
    "2飞8":"钱和深层资源绑定，一旦关系破裂就破财",
    "8飞2":"偏财和正财混在一起，投资判断受自我价值感影响",
    "海王刑冲2宫主":"财务模糊、被欺骗、账目不清",
    "土星刑冲2宫主":"长期缺钱感、赚钱辛苦、延迟回报",
    "2飞12":"钱容易在看不见的地方被消耗，幕后合作缺乏透明度",
    "木星落陷12宫":"灵性领域冲动投入、幕后合作不透明、隐性消耗"
}

# 1.20 婚恋危机风险信号库
LOVE_RISK_SIGNALS = {
    "7宫主落陷":"婚姻关系不稳定、伴侣选择困难",
    "7宫主刑冲火星":"关系中冲突激烈、容易因冲动分手",
    "7宫主刑冲土星":"关系冷漠、长期压抑、婚姻像任务",
    "7宫主刑冲冥王":"控制议题、权力斗争、关系中的信任危机",
    "7宫主刑冲海王":"关系中自欺欺人、被欺骗、边界模糊",
    "5宫主刑冲土星":"恋爱受阻、感情压抑、恋爱中受伤",
    "5宫主刑冲冥王":"恋爱中权力游戏、深层恐惧、占有欲",
    "金星刑冲土星":"感情中不被爱、自我价值感低、关系冷淡",
    "金星刑冲冥王":"爱恨极端、占有欲强、关系中的权力游戏",
    "金星刑冲海王":"感情中容易被骗、为爱牺牲过度、看不清对方真面目",
    "月亮刑冲土星":"情感压抑、在关系中不敢表达需求",
    "月亮刑冲冥王":"情感控制、深层恐惧、关系中的情绪勒索"
}

# 1.21 事业翻车风险信号库
CAREER_RISK_SIGNALS = {
    "10宫主落陷":"事业方向不稳、名声受损",
    "10宫主刑冲火星":"事业中冲动决策、与上级冲突",
    "10宫主刑冲土星":"事业受阻、升迁困难、长期被压制",
    "10宫主刑冲天王":"事业突然变故、被裁员、行业崩塌",
    "10宫主刑冲冥王":"职场权力斗争、被暗算、事业中的信任危机",
    "土星落10宫失势":"事业压力极大、长期不被认可"
}

# 1.22 健康隐患风险信号库
HEALTH_RISK_SIGNALS = {
    "6宫主刑冲火星":"急性病、炎症、手术风险",
    "6宫主刑冲土星":"慢性病、长期劳损、久治不愈",
    "6宫主刑冲海王":"误诊、药物过敏、隐性病症",
    "6宫主刑冲冥王":"重症风险、需要深度治疗",
    "月亮刑冲6宫主":"情绪影响身体、心身疾病",
    "土星落6宫":"长期亚健康、骨骼/牙齿/关节问题"
}

# 1.23 4宫/8宫/12宫疗愈层级
HEALING_LEVEL = {
    4:{"type":"温暖包容型","desc":"像家一样的温暖拥抱，想和很多人建立亲情般的情感关系",
       "keywords":"温暖、包容、亲情、归属、安全、拥抱",
       "industry":"家庭式照护空间、亲子关系修复、社区情感服务、母婴/养老陪伴、民宿/长租公寓、情感陪伴内容创作"},
    8:{"type":"深度真相型","desc":"深挖黑暗里的真相，直面痛苦后完成转化，不是温暖拥抱而是带着你走进黑暗再走出来",
       "keywords":"深度、真相、黑暗、转化、蜕变、重生、对峙",
       "industry":"深度心理咨询/创伤疗愈、危机干预、真相挖掘型调查、生死服务、深度关系修复、权力动态咨询"},
    12:{"type":"超越世俗型","desc":"超越个人的广博大爱，与所有人产生链接，离开世俗框架的灵性归属",
        "keywords":"超越、大爱、灵性、皈依、消融、广博、宗教、庙宇",
        "industry":"宗教/庙宇相关服务、禅修/冥想引导、超个人心理学、灵性课程、大爱公益、泛灵性内容创作、艺术疗愈"}
}

# 1.24 庙旺落陷加分
DIGNITY_SCORE = {"入庙":7,"入旺":6,"中性":0,"失势":-5,"落陷":-4}

# 1.25 相位容许度
ASPECT_ORB = {"合":8,"六合":6,"刑":7,"拱":7,"冲":7}
ASPECT_ANGLE = {"合":0,"六合":60,"刑":90,"拱":120,"冲":180}
ASPECT_SCORE = {"合":3,"跨星座弱合":1,"六合":2,"刑":1,"拱":2,"冲":1}

# 1.26 6宫主落陷星座→身体部位（扩展版：覆盖所有行星×落陷星座组合）
HEALTH_BODY_PART = {
    "火星":{"白羊":"头部、面部","天蝎":"生殖系统、排泄系统","巨蟹":"胃、胸部、消化系统"},
    "金星":{"金牛":"喉咙、甲状腺","天秤":"肾脏、腰部","处女":"消化系统、肠道","白羊":"头部、面部"},
    "水星":{"双子":"手臂、肺部","处女":"消化系统、肠道","射手":"肝脏、臀部","双鱼":"足部、淋巴"},
    "月亮":{"巨蟹":"胃、胸部","摩羯":"骨骼、关节、牙齿","天蝎":"生殖系统"},
    "太阳":{"狮子":"心脏、脊柱","水瓶":"小腿、循环系统"},
    "木星":{"射手":"肝脏、臀部","双鱼":"足部、淋巴","双子":"手臂、肺部","处女":"消化系统、肠道","摩羯":"骨骼、关节"},
    "土星":{"摩羯":"骨骼、关节、牙齿","水瓶":"小腿、循环系统","白羊":"头部、面部","巨蟹":"胃、胸部","狮子":"心脏、脊柱"}
}


# ============================================================
# 第二部分：计算函数
# ============================================================

def get_dignity(planet, sign):
    """查庙旺落陷状态，返回(状态名, 加分)"""
    d = DIGNITY_MAP_V2.get(planet, {})
    for label in ["入庙","入旺","失势","落陷"]:
        signs = d.get(label, [])
        if sign in signs:
            return label, DIGNITY_SCORE[label]
    return "中性", 0

def compute_fly(cusps, planet_houses):
    """计算飞宫表：每宫宫头星座→守护星→该星落宫"""
    fly = {}
    for h in range(1, 13):
        cusp_sign = cusps.get(h, {}).get("sign", "白羊")
        ruler = RULERS.get(cusp_sign, "太阳")
        fly[h] = planet_houses.get(ruler, 1)
    return fly

def determine_sect(sun_house):
    """日夜盘判定：太阳1-6宫=夜盘，7-12宫=日盘"""
    return "日盘" if 7 <= sun_house <= 12 else "夜盘"

def sect_bonus(planet, is_day):
    """Sect得派/失派加减分"""
    day_team = ["太阳","木星","土星"]
    night_team = ["月亮","金星","火星"]
    if is_day:
        return 5 if planet in day_team else (-3 if planet in night_team else 0)
    else:
        return 5 if planet in night_team else (-3 if planet in day_team else 0)

def compute_aspects(planets_data, cusps_data):
    """相位二次校验：计算所有行星间相位，含跨星座判定"""
    aspects = []
    planet_names = ["太阳","月亮","水星","金星","火星","木星","土星","天王星","海王星","冥王星"]
    
    for i in range(len(planet_names)):
        for j in range(i+1, len(planet_names)):
            p1 = planet_names[i]
            p2 = planet_names[j]
            if p1 not in planets_data or p2 not in planets_data:
                continue
            
            # 计算黄经
            s1 = planets_data[p1].get("sign_idx", 0)
            s2 = planets_data[p2].get("sign_idx", 0)
            d1 = planets_data[p1].get("deg", 0)
            d2 = planets_data[p2].get("deg", 0)
            lon1 = s1 * 30 + d1
            lon2 = s2 * 30 + d2
            
            diff = abs(lon1 - lon2)
            if diff > 180:
                diff = 360 - diff
            
            same_sign = (s1 == s2)
            
            for asp_name, asp_angle in ASPECT_ANGLE.items():
                orb = ASPECT_ORB.get(asp_name, 7)
                if abs(diff - asp_angle) <= orb:
                    # 判定类型
                    if asp_name == "合":
                        if same_sign:
                            final_type = "合"
                            score = ASPECT_SCORE["合"]
                        else:
                            final_type = "跨星座弱合"
                            score = ASPECT_SCORE["跨星座弱合"]
                    else:
                        final_type = asp_name
                        score = ASPECT_SCORE[asp_name]
                    
                    is_hard = asp_name in ("刑","冲")
                    aspects.append({
                        "p1": p1, "p2": p2,
                        "type": final_type,
                        "angle": round(diff, 2),
                        "same_sign": same_sign,
                        "score": score,
                        "is_hard": is_hard
                    })
                    break
    
    return aspects

def compute_element_distribution(planets_data):
    """元素分布统计"""
    elements = {"火":0,"土":0,"风":0,"水":0}
    element_planets = {"火":[],"土":[],"风":[],"水":[]}
    for name, info in planets_data.items():
        sign = info.get("sign","")
        elem = SIGN_ELEMENT.get(sign,"")
        if elem:
            elements[elem] += 1
            element_planets[elem].append(name)
    dominant = max(elements, key=elements.get) if any(elements.values()) else "土"
    return {"distribution": elements, "planets": element_planets, "dominant": dominant}

def compute_house_energy(planet_houses, scores):
    """宫位能量聚合"""
    house_energy = {}
    for h in range(1, 13):
        house_energy[h] = {"planets": [], "max_score": 0, "max_planet": None, "is_high": False}
    
    for name, house in planet_houses.items():
        score = scores.get(name, 40)
        house_energy[house]["planets"].append(name)
        if score > house_energy[house]["max_score"]:
            house_energy[house]["max_score"] = score
            house_energy[house]["max_planet"] = name
    
    # 高能宫位判定
    for h, data in house_energy.items():
        data["is_high"] = (
            len(data["planets"]) >= 2 or
            data["max_score"] >= 70 or
            (h in (1,4,7,10) and data["max_score"] >= 60) or
            data.get("is_ruler_house", False)
        )
    
    return house_energy

def score_all_planets(planets_data, planet_houses, fly, asc_sign, is_day, aspects, cusps):
    """行星评分（完整版，含所有加减分项）"""
    scores = {}
    ruler1 = RULERS.get(asc_sign, "太阳")  # 命主星
    
    # 命主星相位数
    ruler_aspects = [a for a in aspects if ruler1 in (a["p1"], a["p2"])]
    ruler_aspect_count = len(ruler_aspects)
    
    # 群星同宫检测
    house_count = {}
    for name, h in planet_houses.items():
        house_count[h] = house_count.get(h, 0) + 1
    
    for name, info in planets_data.items():
        score = PLANET_BASE.get(name, 40)
        house = planet_houses.get(name, 6)
        sign = info.get("sign", "白羊")
        
        # Sect加减
        score += sect_bonus(name, is_day)
        
        # 命主星加分
        if name == ruler1:
            if ruler_aspect_count == 0:
                score += 12
            elif ruler_aspect_count == 1:
                score += 15
            else:
                score += 20
        
        # 群星同宫加分
        if house_count.get(house, 0) >= 3:
            score += 4
        
        # 相位加分
        for a in aspects:
            if name in (a["p1"], a["p2"]):
                score += a["score"]
        
        # 宫位加减
        score += HOUSE_WEIGHT.get(house, 0)
        
        # 发光体加成
        if name in ("太阳","月亮"):
            score += 3
        
        # 合轴加分
        asc_deg = cusps.get(1, {}).get("total", 0)
        mc_deg = cusps.get(10, {}).get("total", 0)
        planet_lon = info.get("sign_idx", 0) * 30 + info.get("deg", 0)
        
        # 合上升
        asc_diff = abs(planet_lon - asc_deg)
        if asc_diff > 180: asc_diff = 360 - asc_diff
        if asc_diff <= 8:
            if house == 1:
                score += 8
            else:
                score += 8 if info.get("sign") == cusps.get(1, {}).get("sign") else 4
        
        # 合天顶
        mc_diff = abs(planet_lon - mc_deg)
        if mc_diff > 180: mc_diff = 360 - mc_diff
        if mc_diff <= 8:
            score += 6 if info.get("sign") == cusps.get(10, {}).get("sign") else 3
        
        # 庙旺落陷
        _, ds = get_dignity(name, sign)
        score += ds
        
        scores[name] = score
    
    return scores

def get_top3(scores):
    """TOP3排序+复核"""
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top3 = ranked[:3]
    
    # 复核：入庙果宫失派不得虚高
    review = []
    for name, score in top3:
        reasons = []
        if score == max(scores.values()):
            reasons.append("分数最高")
        # 检查是否入庙
        dig, _ = get_dignity(name, "")
        if dig == "入庙":
            reasons.append("入庙")
        # 检查是否角宫
        # (需要外部传入house信息，这里简化)
        review.append({"planet": name, "score": score, "reasons": reasons})
    
    # 被挤出的候选
    excluded = []
    if len(ranked) > 3:
        for name, score in ranked[3:6]:
            excluded.append({"planet": name, "score": score})
    
    return top3, review, excluded

def get_role_name(top1, top2):
    """查组合角色名"""
    key = tuple(sorted([top1, top2], key=lambda x: -PLANET_BASE.get(x, 0)))
    return ROLE_MAP.get(key, f"{top1}型{top2}型融合者")

def get_golden_key(fly, cusps, scores, planet_houses):
    """金钥匙链路计算"""
    key1_house = fly.get(1, 1)
    key2_house = fly.get(key1_house, key1_house)
    
    # 判断第一把钥匙强弱
    ruler1 = RULERS.get(cusps.get(1, {}).get("sign", "白羊"), "太阳")
    ruler_score = scores.get(ruler1, 50)
    ruler_house = planet_houses.get(ruler1, 1)
    
    # 强弱判定
    is_strong = ruler_score >= 58
    key2_type = "落地钥匙" if is_strong else "补能钥匙"
    
    # 追踪第三层（如果需要）
    key3_house = fly.get(key2_house, key2_house)
    
    return {
        "key1": f"1飞{key1_house}",
        "key1_house": key1_house,
        "key2": f"{key1_house}飞{key2_house}",
        "key2_house": key2_house,
        "key3_house": key3_house,
        "key2_type": key2_type,
        "is_strong": is_strong,
        "ruler1": ruler1,
        "ruler1_score": ruler_score,
        "ruler1_house": ruler_house
    }

def get_firdaria(age, is_day):
    """法达当前阶段+后续阶段"""
    seq = FIRDARIA_DAY if is_day else FIRDARIA_NIGHT
    current = None
    future = []
    for i, (start, end, ruler) in enumerate(seq):
        if start <= age < end:
            current = {"ruler": ruler, "start": start, "end": end, "age_range": f"{start}-{end}"}
            future = [{"ruler": r, "start": s, "end": e, "age_range": f"{s}-{e}"} 
                      for s, e, r in seq[i+1:i+3]]
            break
    if not current:
        current = {"ruler": seq[-1][2], "start": seq[-1][0], "end": seq[-1][1], "age_range": f"{seq[-1][0]}-{seq[-1][1]}"}
    return current, future

def get_hard_aspects_for(planet, aspects):
    """获取某行星的所有硬相位"""
    hard = []
    for a in aspects:
        if planet in (a["p1"], a["p2"]) and a["is_hard"]:
            other = a["p2"] if a["p1"] == planet else a["p1"]
            hard.append({"with": other, "type": a["type"]})
    return hard

def compute_risk_table(fly, planet_houses, planets_data, aspects, scores, cusp_rulers):
    """人生风险核算表（3.14）
    cusp_rulers: {2:"木星", 5:"木星", 6:"火星", 7:"金星", 8:"水星", 10:"太阳"} 等
    """
    risks = {}
    
    # === 破财风险 ===
    ruler2 = cusp_rulers.get(2, "金星")
    ruler8 = cusp_rulers.get(8, "冥王星")
    money_house = fly.get(2, 2)
    side_house = fly.get(8, 8)
    
    ruler2_hard = get_hard_aspects_for(ruler2, aspects)
    ruler8_hard = get_hard_aspects_for(ruler8, aspects)
    
    # 海王与2/8宫主相位
    neptune_hard_2 = any(a["is_hard"] and ruler2 in (a["p1"], a["p2"]) and "海王星" in (a["p1"], a["p2"]) for a in aspects)
    neptune_hard_8 = any(a["is_hard"] and ruler8 in (a["p1"], a["p2"]) and "海王星" in (a["p1"], a["p2"]) for a in aspects)
    
    # 匹配破财风险信号
    financial_risks = []
    ruler2_dig, _ = get_dignity(ruler2, planets_data.get(ruler2, {}).get("sign", "白羊"))
    if ruler2_dig in ("落陷","失势"):
        financial_risks.append(FINANCIAL_RISK_SIGNALS.get(f"2宫主{ruler2_dig}", ""))
    if fly.get(2) in (8, 12):
        financial_risks.append(FINANCIAL_RISK_SIGNALS.get(f"2飞{fly.get(2)}", ""))
    if fly.get(8) == 2:
        financial_risks.append(FINANCIAL_RISK_SIGNALS.get("8飞2", ""))
    for h in ruler2_hard:
        partner = h['with'].replace('星', '')
        for k in [f"2宫主刑冲{h['with']}", f"2宫主刑冲{partner}"]:
            if k in FINANCIAL_RISK_SIGNALS:
                financial_risks.append(FINANCIAL_RISK_SIGNALS[k])
                break
    for h in ruler8_hard:
        partner = h['with'].replace('星', '')
        for k in [f"8宫主刑冲{h['with']}", f"8宫主刑冲{partner}"]:
            if k in FINANCIAL_RISK_SIGNALS:
                financial_risks.append(FINANCIAL_RISK_SIGNALS[k])
                break
    if neptune_hard_2:
        financial_risks.append(FINANCIAL_RISK_SIGNALS.get("海王刑冲2宫主", ""))
    # 木星落陷12宫特殊信号
    jup_dig, _ = get_dignity("木星", planets_data.get("木星", {}).get("sign", "白羊"))
    if jup_dig in ("落陷",) and planet_houses.get("木星") == 12:
        financial_risks.append(FINANCIAL_RISK_SIGNALS.get("木星落陷12宫", ""))
    
    risks["financial"] = {
        "2_fly": f"2飞{money_house}",
        "8_fly": f"8飞{side_house}",
        "ruler2": ruler2,
        "ruler2_status": ruler2_dig,
        "ruler2_hard": [{"with": h["with"], "type": h["type"]} for h in ruler2_hard],
        "ruler8": ruler8,
        "ruler8_hard": [{"with": h["with"], "type": h["type"]} for h in ruler8_hard],
        "neptune_2": neptune_hard_2,
        "signals": [r for r in financial_risks if r],
        "severity": "高" if len(financial_risks) >= 2 else ("中" if financial_risks else "低")
    }
    
    # === 婚恋危机风险 ===
    ruler7 = cusp_rulers.get(7, "金星")
    ruler5 = cusp_rulers.get(5, "木星")
    ruler7_hard = get_hard_aspects_for(ruler7, aspects)
    ruler7_dig, _ = get_dignity(ruler7, planets_data.get(ruler7, {}).get("sign", "白羊"))
    ruler5_hard = get_hard_aspects_for(ruler5, aspects)
    
    venus_hard = get_hard_aspects_for("金星", aspects)
    moon_hard = get_hard_aspects_for("月亮", aspects)
    
    love_risks = []
    if ruler7_dig in ("落陷","失势"):
        love_risks.append(LOVE_RISK_SIGNALS.get(f"7宫主{ruler7_dig}", ""))
    for h in ruler7_hard:
        partner = h['with'].replace('星', '')
        for k in [f"7宫主刑冲{h['with']}", f"7宫主刑冲{partner}"]:
            if k in LOVE_RISK_SIGNALS:
                love_risks.append(LOVE_RISK_SIGNALS[k])
                break
    for h in ruler5_hard:
        partner = h['with'].replace('星', '')
        for k in [f"5宫主刑冲{h['with']}", f"5宫主刑冲{partner}"]:
            if k in LOVE_RISK_SIGNALS:
                love_risks.append(LOVE_RISK_SIGNALS[k])
                break
    for h in venus_hard:
        # 尝试两种key：带"星"和不带"星"
        partner = h['with'].replace('星', '')
        key1 = f"金星刑冲{h['with']}"
        key2 = f"金星刑冲{partner}"
        if key1 in LOVE_RISK_SIGNALS:
            love_risks.append(LOVE_RISK_SIGNALS[key1])
        elif key2 in LOVE_RISK_SIGNALS:
            love_risks.append(LOVE_RISK_SIGNALS[key2])
    for h in moon_hard:
        partner = h['with'].replace('星', '')
        key1 = f"月亮刑冲{h['with']}"
        key2 = f"月亮刑冲{partner}"
        if key1 in LOVE_RISK_SIGNALS:
            love_risks.append(LOVE_RISK_SIGNALS[key1])
        elif key2 in LOVE_RISK_SIGNALS:
            love_risks.append(LOVE_RISK_SIGNALS[key2])
    
    marriage_house = fly.get(7, 7)
    love_house = fly.get(5, 5)
    
    risks["love"] = {
        "7_fly": f"7飞{marriage_house}",
        "5_fly": f"5飞{love_house}",
        "ruler7": ruler7,
        "ruler7_status": ruler7_dig,
        "ruler7_hard": [{"with": h["with"], "type": h["type"]} for h in ruler7_hard],
        "ruler5": ruler5,
        "ruler5_hard": [{"with": h["with"], "type": h["type"]} for h in ruler5_hard],
        "venus_hard": [{"with": h["with"], "type": h["type"]} for h in venus_hard],
        "moon_hard": [{"with": h["with"], "type": h["type"]} for h in moon_hard],
        "signals": [r for r in love_risks if r],
        "severity": "高" if len(love_risks) >= 2 else ("中" if love_risks else "低")
    }
    
    # === 事业翻车风险 ===
    ruler10 = cusp_rulers.get(10, "太阳")
    ruler10_hard = get_hard_aspects_for(ruler10, aspects)
    ruler10_dig, _ = get_dignity(ruler10, planets_data.get(ruler10, {}).get("sign", "白羊"))
    
    career_risks = []
    if ruler10_dig in ("落陷","失势"):
        career_risks.append(CAREER_RISK_SIGNALS.get(f"10宫主{ruler10_dig}", ""))
    for h in ruler10_hard:
        partner = h['with'].replace('星', '')
        for k in [f"10宫主刑冲{h['with']}", f"10宫主刑冲{partner}"]:
            if k in CAREER_RISK_SIGNALS:
                career_risks.append(CAREER_RISK_SIGNALS[k])
                break
    # 土星落10宫失势
    if planet_houses.get("土星") == 10:
        sat_dig, _ = get_dignity("土星", planets_data.get("土星", {}).get("sign", "白羊"))
        if sat_dig in ("失势",):
            career_risks.append(CAREER_RISK_SIGNALS.get("土星落10宫失势", ""))
    
    career_house = fly.get(10, 10)
    risks["career"] = {
        "10_fly": f"10飞{career_house}",
        "ruler10": ruler10,
        "ruler10_status": ruler10_dig,
        "ruler10_hard": [{"with": h["with"], "type": h["type"]} for h in ruler10_hard],
        "signals": [r for r in career_risks if r],
        "severity": "高" if len(career_risks) >= 2 else ("中" if career_risks else "低")
    }
    
    # === 健康隐患风险 ===
    ruler6 = cusp_rulers.get(6, "水星")
    ruler6_hard = get_hard_aspects_for(ruler6, aspects)
    ruler6_dig, _ = get_dignity(ruler6, planets_data.get(ruler6, {}).get("sign", "白羊"))
    
    health_risks = []
    for h in ruler6_hard:
        partner = h['with'].replace('星', '')
        for k in [f"6宫主刑冲{h['with']}", f"6宫主刑冲{partner}"]:
            if k in HEALTH_RISK_SIGNALS:
                health_risks.append(HEALTH_RISK_SIGNALS[k])
                break
    # 月亮刑冲6宫主
    moon_hard_6 = any(a["is_hard"] and ruler6 in (a["p1"], a["p2"]) and "月亮" in (a["p1"], a["p2"]) for a in aspects)
    if moon_hard_6:
        health_risks.append(HEALTH_RISK_SIGNALS.get("月亮刑冲6宫主", ""))
    # 土星落6宫
    if planet_houses.get("土星") == 6:
        health_risks.append(HEALTH_RISK_SIGNALS.get("土星落6宫", ""))
    
    # 6宫主落陷→身体部位
    body_part = ""
    if ruler6_dig in ("落陷","失势"):
        body_part = HEALTH_BODY_PART.get(ruler6, {}).get(
            planets_data.get(ruler6, {}).get("sign", ""), "需关注整体健康"
        )
    
    health_house = fly.get(6, 6)
    risks["health"] = {
        "6_fly": f"6飞{health_house}",
        "ruler6": ruler6,
        "ruler6_status": ruler6_dig,
        "ruler6_hard": [{"with": h["with"], "type": h["type"]} for h in ruler6_hard],
        "body_part": body_part,
        "signals": [r for r in health_risks if r],
        "severity": "高" if len(health_risks) >= 2 else ("中" if health_risks else "低")
    }
    
    # === 人生暗礁TOP3 ===
    all_risks = [
        ("破财", risks["financial"]["severity"], risks["financial"]["signals"][:2]),
        ("婚恋危机", risks["love"]["severity"], risks["love"]["signals"][:2]),
        ("事业翻车", risks["career"]["severity"], risks["career"]["signals"][:2]),
        ("健康隐患", risks["health"]["severity"], risks["health"]["signals"][:2])
    ]
    severity_order = {"高":0,"中":1,"低":2}
    all_risks.sort(key=lambda x: severity_order.get(x[1], 3))
    risks["top3"] = all_risks[:3]
    
    return risks


# ============================================================
# V3.5：标签化 + 分数化产品字段
# ============================================================

ABILITY_LABELS = {
    "太阳": "使命领导力",
    "月亮": "情绪感知力",
    "水星": "结构化表达力",
    "金星": "审美定价力",
    "火星": "执行突破力",
    "木星": "资源扩张力",
    "土星": "结构搭建力",
    "天王星": "创新破局力",
    "海王星": "灵感共振力",
    "冥王星": "深度洞察力",
}


def clamp_score(n):
    return max(0, min(100, int(round(n))))


def label_by_score(score, high_label, mid_label, low_label):
    if score >= 85:
        return high_label
    if score >= 70:
        return mid_label
    return low_label


AWAKENING_HOUSE_RULES = {
    1: {"difficulty": "最容易", "score": 95, "label": "做自己就开窍", "trigger": "自我呈现、被看见、被证明、主动做决定", "risk": "如果长期被压制、不能表达自己，就会晚开窍"},
    2: {"difficulty": "较容易", "score": 76, "label": "价值交换中开窍", "trigger": "赚钱、买卖、交换价值、建立资产感", "risk": "比1/3/5稍难，需要真正接触钱和价值交换"},
    3: {"difficulty": "最容易", "score": 92, "label": "说话读书就开窍", "trigger": "读书、沟通、表达、交朋友、信息流动", "risk": "如果缺少语言环境和学习环境，会压低开窍速度"},
    4: {"difficulty": "较难", "score": 48, "label": "家庭支持中开窍", "trigger": "温暖家庭、长期共同生活、家族支持、稳定根基", "risk": "需要家庭长期支持，普通成长环境不一定具备"},
    5: {"difficulty": "最容易", "score": 90, "label": "舞台表现中开窍", "trigger": "表演、创作、恋爱、玩乐、被欣赏、有舞台", "risk": "如果不允许表现自己，会压住开窍速度"},
    6: {"difficulty": "中等", "score": 68, "label": "工作技术中开窍", "trigger": "工作、技术、细节、服务、训练、日常任务", "risk": "需要进入具体工作和技术细节，比前三宫更晚一点"},
    7: {"difficulty": "较难", "score": 45, "label": "关系合作中开窍", "trigger": "恋爱、婚姻、合作、真实相处、契约关系", "risk": "需要通过别人打开自己，早年不容易稳定获得这种关系"},
    8: {"difficulty": "较难", "score": 42, "label": "深度安全中开窍", "trigger": "深度亲密、被持续爱、不被背叛、深度研究、私密资源", "risk": "需要长期情感安全和专属资源，门槛较高"},
    9: {"difficulty": "中等偏易", "score": 72, "label": "远行学习中开窍", "trigger": "上学、进修、旅行、走出去、信念系统、高阶知识", "risk": "如果缺少学习环境、远行机会和开阔视野，会延迟开窍"},
    10: {"difficulty": "相当难", "score": 35, "label": "管理责任中开窍", "trigger": "当班长、当负责人、做管理、管项目、做老板领导", "risk": "需要早早承担社会责任和管理角色，对普通人初始门槛很高"},
    11: {"difficulty": "中等偏难", "score": 60, "label": "团队同道中开窍", "trigger": "志同道合团队、社群、组织、共同理想、人脉网络", "risk": "依赖能否找到同频群体，单靠自己较难打开"},
    12: {"difficulty": "较难", "score": 40, "label": "隐秘艺术疗愈中开窍", "trigger": "艺术、疗愈、玄学、修行、宗教、独处、潜意识探索", "risk": "不是事情本身难，而是普通价值观和成长环境不容易支持孩子早早进入这些领域"},
}

AWAKENING_LEVELS = [
    {"level": 1, "from": "火星", "to": "水星", "name": "劳动开窍", "meaning": "从会动手、会劳动，升级为会总结经验、形成知识。"},
    {"level": 2, "from": "水星", "to": "金星", "name": "知识开窍", "meaning": "从会学习、会表达，升级为懂价值、懂审美、懂交换。"},
    {"level": 3, "from": "金星", "to": "月亮", "name": "价值开窍", "meaning": "从为价值服务，升级为关注内心、感受、身份和舒适度。"},
    {"level": 4, "from": "月亮", "to": "太阳", "name": "身份开窍", "meaning": "从关注我是谁、我舒不舒服，升级为面向使命、大爱和更大的创造。"},
    {"level": 5, "from": "太阳", "to": "太阳", "name": "使命显化", "meaning": "把个人使命稳定显化为方向、影响力和可持续的人生主线。"},
]


def compute_awakening_path(golden_key, planet_houses=None, scores=None):
    """命主星落宫开窍标准：1飞X越日常可达，越容易早开窍；落宫越丰满，开窍方法越多。"""
    planet_houses = planet_houses or {}
    scores = scores or {}
    house = int(golden_key.get("key1_house", golden_key.get("ruler1_house", 1)) or 1)
    rule = AWAKENING_HOUSE_RULES.get(house, AWAKENING_HOUSE_RULES[1])
    ruler1 = golden_key.get("ruler1", "")
    planets_in_house = [p for p, h in planet_houses.items() if h == house]
    companion_planets = [p for p in planets_in_house if p != ruler1]
    companion_score_sum = sum(scores.get(p, 50) for p in companion_planets)
    fullness_bonus = 0
    if len(companion_planets) >= 4:
        fullness_bonus = 12
        fullness_label = "极丰满宫"
        fullness_meaning = "命主星落宫资源很多，开窍方式丰富，不只靠命主星单一路径。"
    elif len(companion_planets) >= 2:
        fullness_bonus = 8
        fullness_label = "丰满宫"
        fullness_meaning = "命主星落宫有多颗行星支持，开窍方法多，进入状态更顺。"
    elif len(companion_planets) == 1:
        fullness_bonus = 4
        fullness_label = "有陪伴宫"
        fullness_meaning = "命主星落宫有一个额外抓手，开窍不算孤单。"
    else:
        fullness_label = "平静宫"
        fullness_meaning = "命主星落宫只有命主星自己，开窍入口清楚但方法单一。"
    if companion_score_sum >= 160:
        fullness_bonus += 4
    score = clamp_score(rule["score"] + fullness_bonus)
    if score >= 85:
        stage = "早开窍型"
    elif score >= 70:
        stage = "较易开窍型"
    elif score >= 55:
        stage = "环境触发型"
    elif score >= 40:
        stage = "关系/根基触发型"
    else:
        stage = "晚开窍高门槛型"
    return {
        "key": golden_key.get("key1", f"1飞{house}"),
        "house": house,
        "score": score,
        "base_score": rule["score"],
        "fullness_bonus": fullness_bonus,
        "difficulty": rule["difficulty"],
        "label": rule["label"],
        "stage": stage,
        "daily_trigger": rule["trigger"],
        "risk": rule["risk"],
        "house_fullness": {
            "label": fullness_label,
            "planets": planets_in_house,
            "companion_planets": companion_planets,
            "companion_count": len(companion_planets),
            "meaning": fullness_meaning,
            "rule": "命主星飞入的宫位如果还有月亮、金星、火星等其他行星，就不是单一入口，而是多方法、多资源、多兴趣的丰满开窍场。"
        },
        "five_levels": AWAKENING_LEVELS,
        "rule": "命主星落入越容易在日常生活中达成的宫位，越容易早开窍；1/3/5最容易，2/6/9次之，7/4/8/11/12依赖环境，10宫门槛最高；同宫越丰满，开窍方法越多。"
    }


def get_aspect_between(p1, p2, aspects):
    for a in aspects:
        if p1 in (a.get("p1"), a.get("p2")) and p2 in (a.get("p1"), a.get("p2")):
            return a
    return None


def compute_emotional_consumption(planets, aspects, dignity_table):
    """情绪内耗判定：月亮落陷/失势不等于严重内耗，需结合日月/月金关系。"""
    sun_sign = planets.get("太阳", {}).get("sign", "")
    moon_sign = planets.get("月亮", {}).get("sign", "")
    venus_sign = planets.get("金星", {}).get("sign", "")
    moon_status = dignity_table.get("月亮", {}).get("status", "中性")
    moon_is_damaged = moon_status in ("落陷", "失势")
    same_sign_sun_moon = bool(sun_sign and sun_sign == moon_sign)
    same_element_sun_moon = SIGN_ELEMENT.get(sun_sign) == SIGN_ELEMENT.get(moon_sign) if sun_sign and moon_sign else False
    same_element_moon_venus = SIGN_ELEMENT.get(moon_sign) == SIGN_ELEMENT.get(venus_sign) if moon_sign and venus_sign else False
    sun_moon_aspect = get_aspect_between("太阳", "月亮", aspects)
    moon_venus_aspect = get_aspect_between("月亮", "金星", aspects)
    sun_moon_hard = bool(sun_moon_aspect and sun_moon_aspect.get("is_hard"))
    moon_venus_hard = bool(moon_venus_aspect and moon_venus_aspect.get("is_hard"))
    sun_moon_soft_or_union = same_sign_sun_moon or same_element_sun_moon or bool(sun_moon_aspect and not sun_moon_aspect.get("is_hard"))
    moon_venus_soft_or_union = same_element_moon_venus or bool(moon_venus_aspect and not moon_venus_aspect.get("is_hard"))

    score = 35
    reasons = []
    label = "低内耗型"
    emotional_baseline = "情绪基调正常"

    if moon_is_damaged:
        score += 8
        emotional_baseline = "情绪基调偏冷/偏低昂"
        reasons.append(f"月亮{moon_status}：情绪表达不高昂，容易显得冷静、克制或慢热")
    else:
        reasons.append("月亮未落陷/失势：基础情绪功能不算低配")

    if same_sign_sun_moon:
        score -= 25
        reasons.append("日月同星座：自我目标和情绪需求同频，月亮即便不强，内耗也会明显减轻")
    elif same_element_sun_moon:
        score -= 16
        reasons.append("日月同元素：自我方向和情绪需求有天然兼容，内耗减轻")

    if sun_moon_hard:
        aspect_type = sun_moon_aspect.get("type", "硬相位")
        score += 28
        reasons.append(f"日月{aspect_type}：自我目标和情绪需求冲突，是内耗主因")
    elif sun_moon_aspect and not sun_moon_aspect.get("is_hard"):
        score -= 10
        reasons.append(f"日月{sun_moon_aspect.get('type')}：自我和情绪能互相支持")

    if moon_venus_hard:
        aspect_type = moon_venus_aspect.get("type", "硬相位")
        score += 18
        reasons.append(f"月金{aspect_type}：情绪需求与爱/价值感冲突，会增加关系内耗")
    elif moon_venus_soft_or_union:
        score -= 6
        reasons.append("月亮与金星同频/柔和：情绪需求和价值需求更容易彼此安抚")

    if moon_is_damaged and not sun_moon_soft_or_union:
        score += 18
        reasons.append("月亮不强且日月不同频：这是内耗明显加重的组合")
    if not moon_is_damaged and sun_moon_hard:
        score += 10
        reasons.append("月亮本身不弱，但日月不合：平时状态正常，遇到目标/关系拉扯时才明显内耗")

    score = clamp_score(score)
    if score >= 80:
        label = "高内耗型"
    elif score >= 60:
        label = "阶段性内耗型"
    elif score >= 40:
        label = "轻内耗型"
    else:
        label = "低内耗型"

    if moon_is_damaged and (same_sign_sun_moon or same_element_sun_moon):
        label = "情绪低昂但轻内耗型" if score < 60 else label

    return {
        "score": score,
        "label": label,
        "moon_status": moon_status,
        "emotional_baseline": emotional_baseline,
        "sun_moon_relation": {
            "same_sign": same_sign_sun_moon,
            "same_element": same_element_sun_moon,
            "aspect": sun_moon_aspect,
            "is_hard": sun_moon_hard,
        },
        "moon_venus_relation": {
            "same_element": same_element_moon_venus,
            "aspect": moon_venus_aspect,
            "is_hard": moon_venus_hard,
        },
        "reasons": reasons,
        "rule": "月亮落陷/失势只说明情绪基调偏低或偏冷，不直接等于严重内耗；内耗主要看日月是否同频，以及日月/月金是否紧张。"
    }


def compute_v35_score_card(scores, risks, golden_key, finance, relations, aspects, planets=None, dignity_table=None, awakening_path=None):
    """V3.5/V4.0 总览分数卡：先给确定性标签；人生主线分以开窍指数为核心路径变量。"""
    top_scores = sorted(scores.values(), reverse=True)
    top1_score = top_scores[0] if top_scores else 60
    top2_score = top_scores[1] if len(top_scores) > 1 else top1_score
    avg_top3 = sum(top_scores[:3]) / 3 if top_scores else 60
    hard_count = sum(1 for a in aspects if a.get("is_hard"))
    severity_value = {"低": 35, "中": 60, "高": 85}
    risk_score = max([
        severity_value.get(risks.get(k, {}).get("severity", "低"), 35)
        for k in ["financial", "love", "career", "health"]
    ] or [35])
    relationship_stability = 100 - severity_value.get(risks.get("love", {}).get("severity", "低"), 35) + 20
    execution_score = scores.get("火星", 50) * 0.45 + scores.get(golden_key.get("ruler1", "水星"), 50) * 0.35 + (15 if golden_key.get("is_strong") else 0)
    monetization = scores.get(finance.get("career", {}).get("ruler", "水星"), 50) * 0.35 + scores.get(finance.get("zhengcai", {}).get("ruler", "金星"), 50) * 0.35 + scores.get(golden_key.get("ruler1", "水星"), 50) * 0.30
    noble_support = scores.get("木星", 50) * 0.45 + scores.get("金星", 50) * 0.30 + scores.get("月亮", 50) * 0.25
    emotional_consumption = compute_emotional_consumption(planets or {}, aspects, dignity_table or {})
    self_consumption = emotional_consumption["score"]
    talent_visibility = avg_top3 + (8 if golden_key.get("is_strong") else -3)

    # V4.0：人生主线分升级为“能力 × 开窍路径 × 现实承接 × 风险护栏”。
    # 能力决定有什么，开窍指数决定从哪里打开，现实承接决定能否落地，综合风险决定会不会中途漏掉。
    ruler_score = scores.get(golden_key.get("ruler1", "水星"), 50)
    raw_awakening_score = awakening_path.get("score", 60) if awakening_path else (100 if golden_key.get("is_strong") else 60)
    awakening_base = awakening_path.get("base_score", raw_awakening_score) if awakening_path else raw_awakening_score
    awakening_fullness_bonus = awakening_path.get("fullness_bonus", 0) if awakening_path else 0
    awakening_score = clamp_score(raw_awakening_score)
    career_route = scores.get(finance.get("career", {}).get("ruler", "水星"), top1_score)
    best_money_route = max(monetization, career_route + 8, scores.get(finance.get("zhengcai", {}).get("ruler", "金星"), 50))
    reality_support = career_route * 0.50 + best_money_route * 0.50
    route_risk_penalty = min(4, sum({"低": 0, "中": 0.5, "高": 1}.get(risks.get(k, {}).get("severity", "低"), 0) for k in ["financial", "love", "career", "health"]))
    route_score = (
        awakening_score * 0.35 +
        top1_score * 0.25 +
        reality_support * 0.25 +
        talent_visibility * 0.15 -
        route_risk_penalty
    )
    score_card = {
        "route_score": clamp_score(route_score),
        "total_score": clamp_score(route_score),
        "talent_visibility": clamp_score(talent_visibility),
        "monetization_potential": clamp_score(monetization),
        "relationship_stability": clamp_score(relationship_stability),
        "execution_score": clamp_score(execution_score),
        "risk_score": clamp_score(risk_score),
        "noble_support": clamp_score(noble_support),
        "awakening_score": clamp_score(awakening_score),
        "reality_support": clamp_score(reality_support),
        "route_formula": {
            "meaning": "V4.0人生主线分：判断一个人走对最佳路线时，能力、开窍指数、现实承接和风险护栏的综合支持度。",
            "awakening_score": clamp_score(awakening_score),
            "awakening_base": clamp_score(awakening_base),
            "ruler_score": clamp_score(ruler_score),
            "awakening_fullness_bonus": awakening_fullness_bonus,
            "top1_score": clamp_score(top1_score),
            "reality_support": clamp_score(reality_support),
            "career_route": clamp_score(career_route),
            "best_money_route": clamp_score(best_money_route),
            "talent_visibility": clamp_score(talent_visibility),
            "noble_support": clamp_score(noble_support),
            "route_risk_penalty": route_risk_penalty,
            "formula": "开窍指数×35% + 主能力×25% + 现实承接×25% + 天赋显化×15% - 综合风险扣分",
            "rule": "能力决定你有什么；开窍指数决定你从哪里打开；现实承接决定能不能落地；风险护栏决定会不会中途漏掉。"
        },
    }
    score_labels = {
        "total_score": label_by_score(score_card["total_score"], "最佳路线清晰", "主线可开发", "主线待唤醒"),
        "talent_visibility": label_by_score(score_card["talent_visibility"], "一亮相就有辨识度", "需要作品承接", "先做基础显化"),
        "monetization_potential": label_by_score(score_card["monetization_potential"], "作品变现型", "技能变现型", "先稳定现金流"),
        "relationship_stability": label_by_score(score_card["relationship_stability"], "稳定关系型", "需要边界型", "关系高内耗型"),
        "execution_score": label_by_score(score_card["execution_score"], "强落地型", "有才但要封装", "先补行动系统"),
        "risk_score": label_by_score(score_card["risk_score"], "高暗礁预警", "中度风险提醒", "低风险配置"),
        "noble_support": label_by_score(score_card["noble_support"], "贵人吸引体质", "观点吸引贵人", "先主动链接资源"),
        "self_consumption": emotional_consumption["label"],
    }
    return score_card, score_labels, emotional_consumption


def role_by_score(score):
    if score >= 88:
        return "超级主角"
    if score >= 75:
        return "主角"
    if score >= 55:
        return "配角"
    return "边角料"


def score_to_percentile(score):
    """
    将能力分数映射为百分位，创造稀缺性感觉。
    非线性映射：高分段稀缺性更强。
    
    映射规则：
    - 95-100分 → 前1%-3%（极稀缺）
    - 90-94分  → 前4%-5%（顶尖稀缺）
    - 85-89分  → 前6%-10%（优秀稀缺）
    - 80-84分  → 前11%-15%（优秀）
    - 75-79分  → 前16%-22%（良好偏上）
    - 70-74分  → 前23%-28%（良好）
    - 65-69分  → 前29%-35%（中等偏上）
    - 60-64分  → 前36%-45%（中等）
    - 55-59分  → 前46%-55%（待提升）
    - 50-54分  → 前56%-65%（待开发）
    - <50分    → 前66%-80%（弱势区）
    """
    if score >= 95:
        return 1 + int((100 - score) * 0.4)  # 95→3%, 100→1%
    elif score >= 90:
        return 3 + int((95 - score) * 0.4)  # 90→5%, 94→4%
    elif score >= 85:
        return 6 + int((90 - score) * 0.8)  # 85→10%, 89→6%
    elif score >= 80:
        return 11 + int((85 - score) * 0.8)  # 80→15%, 84→11%
    elif score >= 75:
        return 16 + int((80 - score) * 1.2)  # 75→22%, 79→16%
    elif score >= 70:
        return 23 + int((75 - score) * 1.0)  # 70→28%, 74→23%
    elif score >= 65:
        return 29 + int((70 - score) * 1.2)  # 65→35%, 69→29%
    elif score >= 60:
        return 36 + int((65 - score) * 1.8)  # 60→45%, 64→36%
    elif score >= 55:
        return 46 + int((60 - score) * 1.8)  # 55→55%, 59→46%
    elif score >= 50:
        return 56 + int((55 - score) * 1.8)  # 50→65%, 54→56%
    else:
        return min(80, 66 + int((50 - score) * 0.7))  # <50→66%-80%


def compute_v35_ability_tags(ranked, planets, planet_houses):
    tags = []
    for item in ranked:
        planet, score = item[0], item[1]
        sign = planets.get(planet, {}).get("sign", "")
        house = planet_houses.get(planet, 0)
        label = ABILITY_LABELS.get(planet, f"{planet}能力")
        level = "超级主能力" if score >= 80 else ("主能力" if score >= 70 else ("辅助能力" if score >= 55 else "待开发能力"))
        percentile = score_to_percentile(score)
        tags.append({
            "planet": planet, 
            "ability": label, 
            "score": score, 
            "percentile": percentile,
            "level": level, 
            "anchor": f"{planet}·{sign}·第{house}宫"
        })
    return tags


def profession_name_from_industry(industry, top1_name, top2_name):
    """把行业方向翻译成职业身份。能力不是职业，职业必须是社会角色名。"""
    if any(k in industry for k in ["内容", "传播", "策划"]):
        if top1_name == "水星":
            return "内容架构师"
        return "内容策划师"
    if any(k in industry for k in ["课程", "知识付费", "教育"]):
        return "课程产品设计师"
    if any(k in industry for k in ["咨询", "顾问", "诊断"]):
        if top2_name == "月亮" or top1_name == "月亮":
            return "用户洞察顾问"
        return "咨询诊断师"
    if any(k in industry for k in ["品牌", "审美", "美学"]):
        return "品牌价值顾问"
    if any(k in industry for k in ["关系", "私域", "客户"]):
        return "私域关系经营者"
    if any(k in industry for k in ["空间", "家庭", "生活方式"]):
        return "生活方式顾问"
    if "创作表达" in industry:
        return "表达型创作者"
    if "行政" in industry:
        return "普通行政执行者"
    if "短线" in industry or "投机" in industry:
        return "高压短线销售员"
    return f"{industry}从业者"


def compute_v35_industry_role_map(top1_name, top2_name, scores, finance, golden_key, industry, combo_industry):
    base = []
    primary = combo_industry[:3] if combo_industry else industry[:3]
    for i, name in enumerate(primary):
        score = scores.get(top1_name, 60) * 0.55 + scores.get(top2_name, 60) * 0.25 + (12 if golden_key.get("is_strong") else 0) - i * 4
        profession = profession_name_from_industry(name, top1_name, top2_name)
        current_role = role_by_score(score)
        base.append({"profession": profession, "industry": name, "role": current_role, "score": clamp_score(score), "reason": f"{top1_name}高分+{top2_name}辅助+{golden_key.get('key1')}→{golden_key.get('key2')}"})
    career_scene = finance.get("career", {}).get("scene", "事业场景")
    career_industry = f"{career_scene}相关岗位/项目"
    career_score = scores.get(finance.get("career", {}).get("ruler", top1_name), 60)
    career_role = role_by_score(career_score)
    base.append({"profession": profession_name_from_industry(career_industry, top1_name, top2_name), "industry": career_industry, "role": career_role, "score": clamp_score(career_score), "reason": f"事业路径为{finance.get('career', {}).get('fly', '')}"})
    base.append({"profession": "普通行政执行者", "industry": "纯行政执行/无表达权岗位", "role": "配角", "score": 52, "reason": "核心能力需要表达和决策空间，纯执行会压低显化"})
    base.append({"profession": "高压短线销售员", "industry": "短线投机/口头人情合作", "role": "边角料", "score": 35, "reason": "边界不清会放大风险暗礁"})
    has_protagonist = any(item.get("role") in ("超级主角", "主角") for item in base)
    if not has_protagonist:
        upper_roles = [i for i, item in enumerate(base) if item.get("role") == "配角"]
        if upper_roles:
            idx = upper_roles[0]
            base[idx]["role"] = "主角"
            base[idx]["score"] = max(base[idx]["score"], 76)
            base[idx]["reason"] += "；所有配置综合来看，这是你最有主角感的职业位置"
    return base


def compute_v35_marriage_role_map(relations, risks):
    marriage_scene = relations.get("marriage", {}).get("scene", "关系沟通")
    love_sev = risks.get("love", {}).get("severity", "低")
    penalty = {"高": 18, "中": 8, "低": 0}.get(love_sev, 0)
    return [
        {"type": f"能沟通、能共学、能谈规则的关系", "role": "主角", "score": clamp_score(88 - penalty / 2), "reason": f"婚姻路径为{relations.get('marriage', {}).get('fly', '')}，核心场景是{marriage_scene}"},
        {"type": "情绪稳定、边界清楚、尊重价值的人", "role": "主角", "score": clamp_score(84 - penalty / 2), "reason": "金钱/关系边界清楚，能降低金星压力"},
        {"type": "只要求你懂事、不允许你表达需要的人", "role": "配角", "score": clamp_score(50 - penalty / 3), "reason": "会激活忍耐换安全感的旧模式"},
        {"type": "控制欲强、用爱绑架、把关系变权力游戏的人", "role": "边角料", "score": clamp_score(32 - penalty / 4), "reason": "会触发婚恋危机信号"},
    ]


def compute_v35_money_role_map(finance, scores, risks):
    risk_penalty = {"高": 18, "中": 8, "低": 0}.get(risks.get("financial", {}).get("severity", "低"), 0)
    career_score = scores.get(finance.get("career", {}).get("ruler", "水星"), 60)
    zheng_score = scores.get(finance.get("zhengcai", {}).get("ruler", "金星"), 60)
    return [
        {"model": f"{finance.get('career', {}).get('scene', '事业')}型产品/服务", "role": role_by_score(career_score + 8), "score": clamp_score(career_score + 8), "reason": f"事业路径为{finance.get('career', {}).get('fly', '')}"},
        {"model": f"{finance.get('zhengcai', {}).get('scene', '正财')}型长期现金流", "role": role_by_score(zheng_score), "score": clamp_score(zheng_score), "reason": f"正财路径为{finance.get('zhengcai', {}).get('fly', '')}"},
        {"model": f"{finance.get('piancai', {}).get('scene', '偏财')}型副业/合作", "role": "配角", "score": clamp_score(62 - risk_penalty / 2), "reason": f"偏财路径为{finance.get('piancai', {}).get('fly', '')}，需看边界"},
        {"model": "口头承诺、人情价、短线冲动投入", "role": "边角料", "score": clamp_score(30 - risk_penalty / 3), "reason": "边界不清会直接制造损失"},
    ]


# ============================================================
# V3.8：固定诊断模块（让程序先定路线、标签、打法，大模型只负责表达）
# ============================================================

PLANET_ACTION_VERBS = {
    "太阳": "定方向、立身份、主动带人",
    "月亮": "读情绪、照顾需求、建立安全感",
    "水星": "拆信息、写结构、讲清楚",
    "金星": "定价值、做审美、经营关系",
    "火星": "先行动、抢节点、突破阻力",
    "木星": "放大资源、建立信念、向外扩张",
    "土星": "立规则、搭系统、长期坚持",
    "天王星": "破旧局、做创新、改系统",
    "海王星": "造氛围、做疗愈、连接灵感",
    "冥王星": "看穿真相、处理危机、完成重塑",
}

HOUSE_ACTION_TEMPLATES = {
    1: "把能力放到个人身份、形象表达和主动选择里",
    2: "把能力落到定价、现金流、资产感和价值交换里",
    3: "把能力落到表达、学习、写作、沟通和信息产品里",
    4: "把能力落到家庭根基、空间、安全感和长期后方里",
    5: "把能力落到创作、舞台、作品、恋爱感和个人魅力里",
    6: "把能力落到日常工作、流程、技术、服务和训练里",
    7: "把能力落到合作、客户、伴侣、契约和一对一关系里",
    8: "把能力落到深度资源、信任、风控、亲密和危机处理里",
    9: "把能力落到进修、远方、传播、信念、课程和高阶知识里",
    10: "把能力落到事业名声、管理责任、公众位置和结果交付里",
    11: "把能力落到社群、人脉、平台、粉丝和共同目标里",
    12: "把能力落到幕后沉淀、疗愈、艺术、潜意识和隐性资源里",
}

RISK_ACTIONS = {
    "financial": {
        "name": "破财",
        "avoid": "不要做口头承诺、人情价、冲动投入和边界不清的合作",
        "signal": "一旦出现账目模糊、收益说不清、对方只谈感情不谈规则，就要停",
        "correct": "先写清价格、周期、责任、退出机制，再谈关系和投入",
    },
    "love": {
        "name": "婚恋危机",
        "avoid": "不要用忍、懂事、讨好来换关系稳定",
        "signal": "一旦出现控制、冷暴力、价值贬低、需求不能说，就要预警",
        "correct": "先说边界和需求，再判断这段关系是否值得继续投入",
    },
    "career": {
        "name": "事业翻车",
        "avoid": "不要长期待在无表达权、无决策权、只背锅的位置",
        "signal": "一旦责任不断增加但权力、资源、署名没有增加，就要调整",
        "correct": "把职责、成果、权限和汇报关系写清楚，用作品和数据承接位置",
    },
    "health": {
        "name": "健康隐患",
        "avoid": "不要靠硬扛、熬夜、情绪压抑来换短期效率",
        "signal": "一旦睡眠、消化、炎症、焦虑或身体紧绷反复出现，就要处理",
        "correct": "把休息、运动、饮食、体检和情绪出口纳入固定日程",
    },
}


def top_planet_items(ranked, limit=3):
    return [{"planet": n, "score": s, "ability": ABILITY_LABELS.get(n, f"{n}能力")} for n, s in ranked[:limit]]


def compute_route_diagnosis(score_card, score_labels, ranked, golden_key, finance, industry_role_map, money_role_map):
    top1 = ranked[0][0] if ranked else "水星"
    top2 = ranked[1][0] if len(ranked) > 1 else "月亮"
    best_profession = max(industry_role_map, key=lambda x: x.get("score", 0)) if industry_role_map else {}
    best_money = max(money_role_map, key=lambda x: x.get("score", 0)) if money_role_map else {}
    key_house = golden_key.get("key1_house", 1)
    career_house = finance.get("career", {}).get("house", 10)
    return {
        "route_score": score_card.get("route_score", score_card.get("total_score", 60)),
        "route_label": score_labels.get("total_score", "主线可开发"),
        "route_sentence": f"你的最佳路线是用{ABILITY_LABELS.get(top1, top1)}做主引擎，用{ABILITY_LABELS.get(top2, top2)}做辅助，把自己推到{HOUSE_SCENE.get(key_house, '核心场景')}，再进入{HOUSE_SCENE.get(career_house, '事业场景')}完成变现。",
        "best_route": f"{ABILITY_LABELS.get(top1, top1)} → {HOUSE_SCENE.get(key_house, '核心场景')} → {HOUSE_SCENE.get(career_house, '事业场景')}",
        "main_engine": {"planet": top1, "ability": ABILITY_LABELS.get(top1, top1), "action": PLANET_ACTION_VERBS.get(top1, "把能力做成结果")},
        "support_engine": {"planet": top2, "ability": ABILITY_LABELS.get(top2, top2), "action": PLANET_ACTION_VERBS.get(top2, "辅助主能力显化")},
        "golden_key_route": {
            "key1": golden_key.get("key1", "1飞1"),
            "key2": golden_key.get("key2", "1飞1"),
            "start_scene": HOUSE_SCENE.get(key_house, "自我启动"),
            "start_action": HOUSE_ACTION_TEMPLATES.get(key_house, "先把命主星落宫做成具体行动"),
            "is_strong": golden_key.get("is_strong", False),
        },
        "best_profession": best_profession,
        "best_money_model": best_money,
        "route_formula": score_card.get("route_formula", {}),
    }


def compute_core_identity_detail(top1_name, top2_name, role_name, scores, planets, planet_houses, dignity_table):
    top1_sign = planets.get(top1_name, {}).get("sign", "")
    top2_sign = planets.get(top2_name, {}).get("sign", "")
    top1_house = planet_houses.get(top1_name, 0)
    top2_house = planet_houses.get(top2_name, 0)
    return {
        "identity_label": f"{top1_name}人 · {role_name}",
        "identity_score": clamp_score(scores.get(top1_name, 60) * 0.65 + scores.get(top2_name, 60) * 0.35),
        "core_definition": PLANET_PERSON.get(top1_name, "你的核心能力需要被看见和使用"),
        "main_planet": {
            "planet": top1_name,
            "ability": ABILITY_LABELS.get(top1_name, top1_name),
            "score": scores.get(top1_name, 60),
            "sign": top1_sign,
            "house": top1_house,
            "dignity": dignity_table.get(top1_name, {}).get("status", "中性"),
            "evidence": f"{top1_name}落{top1_sign}第{top1_house}宫，分数{scores.get(top1_name, 60)}",
        },
        "support_planet": {
            "planet": top2_name,
            "ability": ABILITY_LABELS.get(top2_name, top2_name),
            "score": scores.get(top2_name, 60),
            "sign": top2_sign,
            "house": top2_house,
            "dignity": dignity_table.get(top2_name, {}).get("status", "中性"),
            "evidence": f"{top2_name}落{top2_sign}第{top2_house}宫，分数{scores.get(top2_name, 60)}",
        },
        "not_suitable_identity": "不适合长期扮演无表达、无定价、无选择权，只负责消耗自己的角色",
    }


def compute_ability_interpretations(ability_tags, planets, planet_houses, dignity_table):
    interpretations = []
    for tag in ability_tags[:5]:
        planet = tag.get("planet", "")
        house = planet_houses.get(planet, 0)
        sign = planets.get(planet, {}).get("sign", "")
        status = dignity_table.get(planet, {}).get("status", "中性")
        interpretations.append({
            "planet": planet,
            "ability": tag.get("ability", ABILITY_LABELS.get(planet, planet)),
            "score": tag.get("score", 60),
            "level": tag.get("level", "主能力"),
            "evidence": f"{planet}落{sign}第{house}宫，状态{status}",
            "best_use": HOUSE_ACTION_TEMPLATES.get(house, "把能力放进真实场景里反复使用"),
            "wrong_use": "只在脑子里想、只替别人消耗、只做低价执行，都会压低这项能力",
            "activation_action": PLANET_ACTION_VERBS.get(planet, "把这项能力做成可交付成果"),
        })
    return interpretations


def compute_money_strategy(finance, money_role_map, risks, scores, golden_key):
    financial_risk = risks.get("financial", {})
    best_model = max(money_role_map, key=lambda x: x.get("score", 0)) if money_role_map else {}
    return {
        "money_label": label_by_score(best_model.get("score", 60), "高价值变现型", "技能现金流型", "先稳现金流型"),
        "best_model": best_model,
        "zhengcai_path": finance.get("zhengcai", {}),
        "piancai_path": finance.get("piancai", {}),
        "career_money_path": finance.get("career", {}),
        "pricing_rule": "先用主能力定价，再用金钥匙场景放大，不要用辛苦程度定价",
        "cashflow_action": f"围绕{best_model.get('model', '核心能力产品/服务')}设计一个可重复交付的产品包",
        "red_line": RISK_ACTIONS["financial"]["avoid"] if financial_risk.get("severity") != "低" else "即便破财风险低，也要保留报价、合同、付款节点和交付边界",
        "early_signal": RISK_ACTIONS["financial"]["signal"],
        "correct_response": RISK_ACTIONS["financial"]["correct"],
        "evidence": [finance.get("zhengcai", {}).get("fly", ""), finance.get("piancai", {}).get("fly", ""), f"命主星{golden_key.get('ruler1', '')}分数{scores.get(golden_key.get('ruler1', ''), 60)}"],
    }


def compute_marriage_strategy(relations, marriage_role_map, risks):
    love_risk = risks.get("love", {})
    best_relation = max(marriage_role_map, key=lambda x: x.get("score", 0)) if marriage_role_map else {}
    return {
        "marriage_label": label_by_score(best_relation.get("score", 60), "高质量关系主角", "边界沟通型关系", "先修边界再进入关系"),
        "best_partner_type": best_relation,
        "love_path": relations.get("love", {}),
        "marriage_path": relations.get("marriage", {}),
        "family_path": relations.get("family", {}),
        "must_have": "能沟通规则、尊重价值、允许你表达需要的人",
        "must_avoid": RISK_ACTIONS["love"]["avoid"] if love_risk.get("severity") != "低" else "不要为了维持和气而长期压低真实需求",
        "early_signal": RISK_ACTIONS["love"]["signal"],
        "correct_response": RISK_ACTIONS["love"]["correct"],
        "evidence": [relations.get("marriage", {}).get("fly", ""), relations.get("love", {}).get("fly", ""), f"婚恋风险{love_risk.get('severity', '低')}"],
    }


def compute_awakening_strategy(awakening_path, golden_key):
    house = awakening_path.get("house", golden_key.get("key1_house", 1))
    return {
        "awakening_score": awakening_path.get("score", 60),
        "awakening_label": awakening_path.get("stage", "环境触发型"),
        "entry": awakening_path.get("label", "找到命主星入口"),
        "first_action": HOUSE_ACTION_TEMPLATES.get(house, "先做命主星落宫对应的日常行动"),
        "daily_trigger": awakening_path.get("daily_trigger", "持续进入对应场景"),
        "risk": awakening_path.get("risk", "长期不进入对应场景会延迟开窍"),
        "house_fullness": awakening_path.get("house_fullness", {}),
        "five_levels": awakening_path.get("five_levels", []),
    }


def compute_emotional_strategy(emotional_consumption, planets, aspects):
    score = emotional_consumption.get("score", 40)
    if score >= 80:
        method = "先降压，再表达；先恢复身体安全感，再做重大决定"
    elif score >= 60:
        method = "把情绪和任务拆开，遇到关系拉扯时先暂停再沟通"
    else:
        method = "保持稳定节奏，用表达和行动定期清理小情绪"
    return {
        "consumption_score": score,
        "consumption_label": emotional_consumption.get("label", "低内耗型"),
        "moon_status": emotional_consumption.get("moon_status", "中性"),
        "emotional_baseline": emotional_consumption.get("emotional_baseline", "情绪基调正常"),
        "method": method,
        "wrong_response": "不要把情绪压成懂事，也不要把阶段性低落误判成能力不行",
        "correct_response": "先识别触发源，再决定是沟通、休息、设边界还是推进任务",
        "evidence": emotional_consumption.get("reasons", []),
    }


def compute_risk_playbook(risks):
    order = {"高": 0, "中": 1, "低": 2}
    risk_keys = [("financial", risks.get("financial", {})), ("love", risks.get("love", {})), ("career", risks.get("career", {})), ("health", risks.get("health", {}))]
    risk_keys.sort(key=lambda x: order.get(x[1].get("severity", "低"), 3))
    playbook = []
    for key, data in risk_keys:
        rule = RISK_ACTIONS[key]
        playbook.append({
            "risk_key": key,
            "risk_name": rule["name"],
            "severity": data.get("severity", "低"),
            "signals": data.get("signals", [])[:3],
            "early_signal": rule["signal"],
            "wrong_response": rule["avoid"],
            "correct_response": rule["correct"],
            "evidence": {k: v for k, v in data.items() if k not in ("signals",)},
        })
    return {"top3": playbook[:3], "all": playbook, "rule": "先处理高风险暗礁，再放大主线优势。风险不是吓人，是提前设置护栏。"}


def compute_action_plan_90d(route_diagnosis, ability_interpretations, money_strategy, marriage_strategy, awakening_strategy, risk_playbook):
    top_ability = ability_interpretations[0] if ability_interpretations else {}
    top_risk = risk_playbook.get("top3", [{}])[0] if risk_playbook.get("top3") else {}
    return [
        {
            "days": "第1-30天",
            "theme": "定主线：确认你靠什么能力吃饭",
            "actions": [
                f"每天围绕{top_ability.get('ability', '主能力')}做一个可展示的小输出",
                f"进入{route_diagnosis.get('golden_key_route', {}).get('start_scene', '金钥匙场景')}，不要只停留在想法里",
                f"列出3个最适合你的职业身份，优先测试{route_diagnosis.get('best_profession', {}).get('profession', '主角职业')}"
            ],
            "deliverable": "形成一页个人主线定位卡",
        },
        {
            "days": "第31-60天",
            "theme": "做产品：把能力变成可交付成果",
            "actions": [
                f"设计一个{money_strategy.get('best_model', {}).get('model', '核心能力产品/服务')}",
                "写清价格、交付边界、适合人群和不适合人群",
                f"避开第一暗礁：{top_risk.get('wrong_response', '不要进入边界不清的消耗场景')}"
            ],
            "deliverable": "完成一个可报价、可交付、可复购的产品包",
        },
        {
            "days": "第61-90天",
            "theme": "放大路线：用关系和场景承接主角位置",
            "actions": [
                "把前60天成果公开展示或交给真实客户验证",
                f"用{marriage_strategy.get('must_have', '清晰边界和真实表达')}筛选合作与亲密关系",
                f"持续使用开窍入口：{awakening_strategy.get('daily_trigger', '进入命主星落宫场景')}"
            ],
            "deliverable": "形成一套能持续迭代的人生剧本执行节奏",
        },
    ]


def compute_execution_card(route_diagnosis, core_identity, money_strategy, marriage_strategy, awakening_strategy, emotional_strategy, risk_playbook):
    top_risks = risk_playbook.get("top3", [])
    return {
        "one_line_identity": core_identity.get("identity_label", "核心身份待确认"),
        "route_score": route_diagnosis.get("route_score", 60),
        "best_route": route_diagnosis.get("route_sentence", "先找到主能力，再进入金钥匙场景完成显化"),
        "main_ability": core_identity.get("main_planet", {}),
        "support_ability": core_identity.get("support_planet", {}),
        "money_model": money_strategy.get("best_model", {}),
        "relationship_rule": marriage_strategy.get("must_have", "选择能尊重你价值和边界的人"),
        "awakening_entry": awakening_strategy.get("entry", "命主星落宫入口"),
        "emotional_rule": emotional_strategy.get("method", "先稳情绪，再做决定"),
        "top_red_lines": [r.get("wrong_response", "") for r in top_risks],
        "ninety_day_focus": "先定主线，再做产品，最后用真实关系和真实市场验证。",
        "next_90_days": "先定主线，再做产品，最后用真实关系和真实市场验证。",
    }


def compute_v38_modules(top1_name, top2_name, role_name, ranked, scores, planets, planet_houses, dignity_table, golden_key, finance, relations, risks, score_card, score_labels, ability_tags, industry_role_map, marriage_role_map, money_role_map, awakening_path, emotional_consumption):
    route_diagnosis = compute_route_diagnosis(score_card, score_labels, ranked, golden_key, finance, industry_role_map, money_role_map)
    core_identity = compute_core_identity_detail(top1_name, top2_name, role_name, scores, planets, planet_houses, dignity_table)
    ability_interpretations = compute_ability_interpretations(ability_tags, planets, planet_houses, dignity_table)
    money_strategy = compute_money_strategy(finance, money_role_map, risks, scores, golden_key)
    marriage_strategy = compute_marriage_strategy(relations, marriage_role_map, risks)
    awakening_strategy = compute_awakening_strategy(awakening_path, golden_key)
    emotional_strategy = compute_emotional_strategy(emotional_consumption, planets, [])
    risk_playbook = compute_risk_playbook(risks)
    action_plan_90d = compute_action_plan_90d(route_diagnosis, ability_interpretations, money_strategy, marriage_strategy, awakening_strategy, risk_playbook)
    execution_card = compute_execution_card(route_diagnosis, core_identity, money_strategy, marriage_strategy, awakening_strategy, emotional_strategy, risk_playbook)
    return {
        "version": "V4.0-awakening-weighted",
        "principle": "程序先固定路线、分数、标签、风险和行动方案；人生主线分升级为开窍指数优先模型，按用户友好结构输出：先总览、再证据、后行动，所有术语必须翻成人话。",
        "route_diagnosis": route_diagnosis,
        "core_identity": core_identity,
        "ability_interpretations": ability_interpretations,
        "money_strategy": money_strategy,
        "marriage_strategy": marriage_strategy,
        "awakening_strategy": awakening_strategy,
        "emotional_strategy": emotional_strategy,
        "risk_playbook": risk_playbook,
        "action_plan_90d": action_plan_90d,
        "execution_card": execution_card,
    }


def precompute(chart_data, birth_date_str=None):
    """
    主函数：接收星盘数据，输出预计算JSON
    
    chart_data 格式（来自 birth_report_sweph.py 或手动输入）：
    {
        "planets": {"太阳":{"sign":"摩羯","deg":4.27,"deg_str":"04°16′","sign_idx":9}, ...},
        "cusps": {1:{"sign":"天蝎","deg":7.07,"total":227.07}, ...},
        "asc_sign": "天蝎",
        "mc_sign": "狮子",
        "planet_houses": {"太阳":2, "月亮":3, ...}
    }
    
    birth_date_str: "1983-01-06" 格式，用于计算法达
    """
    planets = chart_data.get("planets", {})
    cusps = chart_data.get("cusps", {})
    asc_sign = chart_data.get("asc_sign", "白羊")
    mc_sign = chart_data.get("mc_sign", "白羊")
    planet_houses = chart_data.get("planet_houses", {})
    
    # 确保planets有sign_idx
    sign_list = ["白羊","金牛","双子","巨蟹","狮子","处女","天秤","天蝎","射手","摩羯","水瓶","双鱼"]
    for name, info in planets.items():
        if "sign_idx" not in info:
            info["sign_idx"] = sign_list.index(info.get("sign", "白羊")) if info.get("sign") in sign_list else 0
    
    # === 3.3 宫头表+守护星 ===
    cusp_rulers = {}
    for h in range(1, 13):
        cusp_sign = cusps.get(h, {}).get("sign", sign_list[(h-1) % 12])
        cusp_rulers[h] = RULERS.get(cusp_sign, "太阳")
    
    # === 3.4 飞宫表 ===
    fly = compute_fly(cusps, planet_houses)
    
    # === 3.5 日夜盘 ===
    sun_house = planet_houses.get("太阳", 1)
    is_day = 7 <= sun_house <= 12
    sect = "日盘" if is_day else "夜盘"
    
    # === 3.6 庙旺落陷 ===
    dignity_table = {}
    for name, info in planets.items():
        dig, ds = get_dignity(name, info.get("sign", "白羊"))
        dignity_table[name] = {"status": dig, "score": ds}
    
    # === 3.7 相位校验 ===
    aspects = compute_aspects(planets, cusps)
    
    # === 3.8 元素分布 ===
    elements = compute_element_distribution(planets)
    
    # === 3.9-3.10 行星评分 ===
    scores = score_all_planets(planets, planet_houses, fly, asc_sign, is_day, aspects, cusps)
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top3_list = ranked[:3]
    top1_name = top3_list[0][0]
    top1_score = top3_list[0][1]
    top2_name = top3_list[1][0] if len(top3_list) > 1 else "月亮"
    top2_score = top3_list[1][1] if len(top3_list) > 1 else 0
    top3_name = top3_list[2][0] if len(top3_list) > 2 else "水星"
    
    # 宫位能量
    house_energy = compute_house_energy(planet_houses, scores)
    
    # === 3.11 财运主星压力表 ===
    finance = {
        "zhengcai": {
            "fly": f"2飞{fly.get(2,2)}",
            "house": fly.get(2, 2),
            "scene": HOUSE_SCENE.get(fly.get(2,2), "资源变现"),
            "keywords": HOUSE_KEYWORDS.get(fly.get(2,2), ""),
            "ruler": cusp_rulers.get(2, "金星"),
            "ruler_status": dignity_table.get(cusp_rulers.get(2, "金星"), {}).get("status", "中性"),
            "ruler_hard": get_hard_aspects_for(cusp_rulers.get(2, "金星"), aspects)
        },
        "career": {
            "fly": f"10飞{fly.get(10,10)}",
            "house": fly.get(10, 10),
            "scene": HOUSE_SCENE.get(fly.get(10,10), "事业名声"),
            "keywords": HOUSE_KEYWORDS.get(fly.get(10,10), ""),
            "ruler": cusp_rulers.get(10, "太阳"),
            "ruler_status": dignity_table.get(cusp_rulers.get(10, "太阳"), {}).get("status", "中性"),
            "ruler_hard": get_hard_aspects_for(cusp_rulers.get(10, "太阳"), aspects)
        },
        "piancai": {
            "fly": f"8飞{fly.get(8,8)}",
            "house": fly.get(8, 8),
            "scene": HOUSE_SCENE.get(fly.get(8,8), "深度资源"),
            "keywords": HOUSE_KEYWORDS.get(fly.get(8,8), ""),
            "risk": RISK_8FLY.get(fly.get(8,8), ""),
            "ruler": cusp_rulers.get(8, "冥王星"),
            "ruler_status": dignity_table.get(cusp_rulers.get(8, "冥王星"), {}).get("status", "中性"),
            "ruler_hard": get_hard_aspects_for(cusp_rulers.get(8, "冥王星"), aspects)
        }
    }
    
    # === 3.12 金钥匙 ===
    golden_key = get_golden_key(fly, cusps, scores, planet_houses)
    
    # === 3.13 法达 ===
    age = None
    firdaria = None
    if birth_date_str:
        try:
            dt = datetime.strptime(birth_date_str, "%Y-%m-%d")
            now = datetime.now()
            age = now.year - dt.year
            if (now.month, now.day) < (dt.month, dt.day):
                age -= 1
            current, future = get_firdaria(age, is_day)
            firdaria = {
                "age": age,
                "current": current,
                "future": future,
                "partner": FIRDARIA_PARTNER.get(current["ruler"], ""),
                "current_ruler_house": planet_houses.get(current["ruler"], 1),
                "current_ruler_status": dignity_table.get(current["ruler"], {}).get("status", "中性")
            }
        except:
            firdaria = None
    
    # === 3.14 人生风险核算 ===
    risks = compute_risk_table(fly, planet_houses, planets, aspects, scores, cusp_rulers)
    
    # === 角色名 ===
    role_name = get_role_name(top1_name, top2_name)
    
    # === 行业建议 ===
    industry = INDUSTRY_MAP.get(top1_name, [])
    combo_key = tuple(sorted([top1_name, top2_name], key=lambda x: -PLANET_BASE.get(x, 0)))
    combo_industry = INDUSTRY_COMBO.get(combo_key, [])
    
    # === 关系飞宫 ===
    relations = {
        "love": {"fly": f"5飞{fly.get(5,5)}", "house": fly.get(5,5), "scene": HOUSE_SCENE.get(fly.get(5,5),""), "keywords": HOUSE_KEYWORDS.get(fly.get(5,5),"")},
        "marriage": {"fly": f"7飞{fly.get(7,7)}", "house": fly.get(7,7), "scene": HOUSE_SCENE.get(fly.get(7,7),""), "keywords": HOUSE_KEYWORDS.get(fly.get(7,7),"")},
        "family": {"fly": f"4飞{fly.get(4,4)}", "house": fly.get(4,4), "scene": HOUSE_SCENE.get(fly.get(4,4),""), "keywords": HOUSE_KEYWORDS.get(fly.get(4,4),"")},
        "health": {"fly": f"6飞{fly.get(6,6)}", "house": fly.get(6,6), "scene": HOUSE_SCENE.get(fly.get(6,6),""), "keywords": HOUSE_KEYWORDS.get(fly.get(6,6),"")}
    }
    
    # === 天赋三层描述数据 ===
    talents = []
    for name, score in top3_list:
        info = planets.get(name, {})
        sign = info.get("sign", "白羊")
        house = planet_houses.get(name, 1)
        dig = dignity_table.get(name, {}).get("status", "中性")
        talents.append({
            "planet": name,
            "score": score,
            "sign": sign,
            "house": house,
            "dignity": dig,
            "nature": PLANET_NATURE.get(name, ""),
            "sign_style": SIGN_STYLE.get(sign, ""),
            "house_scene": HOUSE_SCENE.get(house, ""),
            "house_keywords": HOUSE_KEYWORDS.get(house, ""),
            "house_type": HOUSE_TYPE.get(house, "")
        })
    
    # 太阳天赋（单独）
    sun_info = planets.get("太阳", {})
    sun_talent = {
        "planet": "太阳",
        "score": scores.get("太阳", 65),
        "sign": sun_info.get("sign", "白羊"),
        "house": planet_houses.get("太阳", 1),
        "dignity": dignity_table.get("太阳", {}).get("status", "中性"),
        "nature": PLANET_NATURE["太阳"],
        "sign_style": SIGN_STYLE.get(sun_info.get("sign", "白羊"), ""),
        "house_scene": HOUSE_SCENE.get(planet_houses.get("太阳", 1), ""),
        "house_keywords": HOUSE_KEYWORDS.get(planet_houses.get("太阳", 1), "")
    }
    
    # === 疗愈层级 ===
    healing = {}
    for h in [4, 8, 12]:
        if fly.get(h) in [4, 8, 12]:
            healing[f"{h}飞{fly[h]}"] = HEALING_LEVEL.get(fly[h], {})
    
    # === V3.5 标签化 + 分数化产品字段 ===
    awakening_path = compute_awakening_path(golden_key, planet_houses, scores)
    score_card, score_labels, emotional_consumption = compute_v35_score_card(scores, risks, golden_key, finance, relations, aspects, planets, dignity_table, awakening_path)
    ability_tags = compute_v35_ability_tags(ranked, planets, planet_houses)
    industry_role_map = compute_v35_industry_role_map(top1_name, top2_name, scores, finance, golden_key, industry, combo_industry)
    marriage_role_map = compute_v35_marriage_role_map(relations, risks)
    money_role_map = compute_v35_money_role_map(finance, scores, risks)
    v38_modules = compute_v38_modules(
        top1_name, top2_name, role_name, ranked, scores, planets, planet_houses, dignity_table,
        golden_key, finance, relations, risks, score_card, score_labels, ability_tags,
        industry_role_map, marriage_role_map, money_role_map, awakening_path, emotional_consumption
    )
    
    # === 组装最终JSON ===
    result = {
        # 基础信息
        "sect": sect,
        "is_day": is_day,
        "asc_sign": asc_sign,
        "mc_sign": mc_sign,
        
        # TOP3 + 角色
        "top3": [{"planet": n, "score": s} for n, s in top3_list],
        "top1": top1_name,
        "top1_score": top1_score,
        "top2": top2_name,
        "top2_score": top2_score,
        "role_name": role_name,
        "planet_person_label": f"{top1_name}人",
        "planet_person_def": PLANET_PERSON.get(top1_name, ""),
        
        # 天赋数据
        "talents": talents,
        "sun_talent": sun_talent,
        
        # 行业建议
        "industry_primary": industry[:3],
        "industry_combo": combo_industry[:3] if combo_industry else [industry[0] if industry else "咨询顾问"],
        
        # 金钥匙
        "golden_key": golden_key,
        
        # 财运
        "finance": finance,
        
        # 关系
        "relations": relations,
        
        # 法达
        "firdaria": firdaria,
        "age": age,
        
        # 风险
        "risks": risks,
        
        # 疗愈层级
        "healing": healing,
        
        # 庙旺落陷
        "dignity": dignity_table,
        
        # 飞宫完整表
        "fly": {h: fly.get(h, h) for h in range(1, 13)},
        "fly_str": {h: f"{h}飞{fly.get(h, h)}" for h in range(1, 13)},
        
        # 宫头守护星
        "cusp_rulers": cusp_rulers,
        
        # 相位表
        "aspects": [{"p1": a["p1"], "p2": a["p2"], "type": a["type"], "is_hard": a["is_hard"]} for a in aspects],
        
        # 元素
        "elements": elements,
        
        # 行星评分完整
        "scores": scores,
        "ranked": [{"planet": n, "score": s} for n, s in ranked],
        
        # 宫位能量
        "house_energy": {h: {"planets": d["planets"], "max_score": d["max_score"], "is_high": d["is_high"]} for h, d in house_energy.items()},
        
        # 行星落点（供参考）
        "planet_positions": {name: {"sign": info.get("sign",""), "deg_str": info.get("deg_str",""), "house": planet_houses.get(name, 0)} for name, info in planets.items()},
        
        # V3.5 标签化 + 分数化产品字段
        "v35": {
            "score_card": score_card,
            "score_labels": score_labels,
            "ability_tags": ability_tags,
            "industry_role_map": industry_role_map,
            "marriage_role_map": marriage_role_map,
            "money_role_map": money_role_map,
            "tag_rule": "每一段解释前先给标签、分数、等级，再给证据链和行动工具",
            "emotional_consumption": emotional_consumption,
            "awakening_path": awakening_path,
        },
        
        # V3.8 固定诊断模块
        "v38": v38_modules,
    }
    
    return result


# ============================================================
# 第四部分：从手动输入的星盘数据构建chart_data
# ============================================================

def parse_manual_chart(planet_lines, house_lines, aspect_lines=None):
    """
    从手动输入的星盘文本构建chart_data
    
    planet_lines 格式：
    ["太阳： 摩羯座04°16′第2宫", "月亮： 摩羯座24°36′第3宫", ...]
    
    house_lines 格式：
    ["第1宫： 天蝎座07°04′(上升)", "第2宫： 射手座06°17′", ...]
    """
    sign_list = ["白羊","金牛","双子","巨蟹","狮子","处女","天秤","天蝎","射手","摩羯","水瓶","双鱼"]
    planets = {}
    planet_houses = {}
    
    for line in planet_lines:
        # 太阳： 摩羯座04°16′第2宫
        m = re.match(r"(\S+)[：:]\s*(\S+)座(\d+)°(\d+).+?第(\d+)宫", line)
        if m:
            name = m.group(1)
            sign = m.group(2)
            deg = int(m.group(3)) + int(m.group(4)) / 60
            house = int(m.group(5))
            sign_idx = sign_list.index(sign) if sign in sign_list else 0
            planets[name] = {
                "sign": sign, "deg": deg, 
                "deg_str": f"{int(deg):02d}°{int((deg%1)*60):02d}′",
                "sign_idx": sign_idx
            }
            planet_houses[name] = house
    
    # 上升
    asc_sign = None
    cusps = {}
    for line in house_lines:
        # 第1宫： 天蝎座07°04′(上升)
        m = re.match(r"第(\d+)宫[：:]\s*(\S+)座(\d+)°(\d+)", line)
        if m:
            h = int(m.group(1))
            sign = m.group(2)
            deg = int(m.group(3)) + int(m.group(4)) / 60
            sign_idx = sign_list.index(sign) if sign in sign_list else 0
            cusps[h] = {"sign": sign, "deg": deg, "total": sign_idx * 30 + deg}
            if h == 1:
                asc_sign = sign
    
    # 天顶
    mc_sign = cusps.get(10, {}).get("sign", "白羊")
    
    return {
        "planets": planets,
        "cusps": cusps,
        "asc_sign": asc_sign or "白羊",
        "mc_sign": mc_sign,
        "planet_houses": planet_houses
    }


# ============================================================
# 第五部分：命令行测试
# ============================================================

if __name__ == "__main__":
    # 用之前的测试星盘数据
    planet_input = [
        "太阳： 摩羯座04°16′第2宫",
        "月亮： 摩羯座24°36′第3宫",
        "水星： 射手座18°18′第2宫",
        "金星： 水瓶座19°42′第4宫",
        "火星： 巨蟹座22°41′第9宫",
        "木星： 天秤座12°53′第12宫",
        "土星： 水瓶座15°38′第4宫",
        "天王星： 摩羯座17°21′第3宫",
        "海王星： 摩羯座18°10′第3宫",
        "冥王星： 天蝎座24°15′第1宫",
    ]
    
    house_input = [
        "第1宫： 天蝎座07°04′(上升)",
        "第2宫： 射手座06°17′",
        "第3宫： 摩羯座06°19′",
        "第4宫： 水瓶座07°28′(天底)",
        "第5宫： 双鱼座09°17′",
        "第6宫： 白羊座09°44′",
        "第7宫： 金牛座07°04′(下降)",
        "第8宫： 双子座06°17′",
        "第9宫： 巨蟹座06°19′",
        "第10宫： 狮子座07°28′(天顶)",
        "第11宫： 处女座09°17′",
        "第12宫： 天秤座09°44′",
    ]
    
    chart = parse_manual_chart(planet_input, house_input)
    result = precompute(chart, "1983-01-06")
    
    # 输出JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))
