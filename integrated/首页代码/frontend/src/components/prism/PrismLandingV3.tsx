import "@/styles/prism-landing-v3.css";

interface PrismLandingV3Props {
  onStart: () => void;
  questionCount?: number;
}

export default function PrismLandingV3({ onStart, questionCount = 20 }: PrismLandingV3Props) {
  return (
    <div className="prism-landing-v3-wrap">
      <div className="prism-landing-v3">
        <section className="v3-hero">
          <div className="v3-brand">
            <span className="v3-brand-en">LIFE SCRIPT</span>
            <span className="v3-brand-zh">人生剧本</span>
          </div>

          <div className="v3-hero-watermark" aria-hidden>
            LIFE
            <br />
            SCRIPT
          </div>

          <div className="v3-hero-inner">
            <div className="v3-hero-visual">
              <div className="v3-texture" aria-hidden />
              <div className="v3-portrait">
                <img src="/images/luodao-halfbody-v2.png?v=20260720" alt="Judica Heventh" />
              </div>
            </div>

            <div className="v3-hero-info">
              <h1 className="v3-name">Judica Heventh</h1>
              <p className="v3-title">占星学领军人物</p>
              <div className="v3-credentials">
                <span>天赋星球创始人</span>
                <span className="v3-sep" aria-hidden />
                <span>全网超过千万粉丝</span>
              </div>
            </div>
          </div>

          <div className="v3-diagonal" aria-hidden />
        </section>

        <div className="v3-main">
          <section className="v3-content">
            <p className="v3-line">
              五千年人类文明史上<span className="v3-gold">20位先贤</span>
            </p>
            <p className="v3-line">穿越时空向你发问</p>
            <p className="v3-sage">
              <span className="v3-gold">德尔斐祭司</span>
              <span className="v3-sage-era">古希腊 · 公元前4世纪</span>
            </p>
            <p className="v3-line">回答这{questionCount}道触及灵魂的追问</p>
            <p className="v3-line">你将获得一份只属于你的</p>
            <h2 className="v3-script-title">&ldquo;人生剧本&rdquo;</h2>
            <p className="v3-footnote">
              每一个提问者，都真实存在过。他们的追问来自古老典籍与神秘手稿
            </p>
          </section>

          <section className="v3-cta">
            <button type="button" className="v3-start-btn" onClick={onStart}>
              <svg className="v3-orbit" viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
                <circle cx="100" cy="100" r="78" stroke="rgba(232,194,126,0.18)" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="64" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
                <circle cx="100" cy="8" r="2.5" fill="rgba(232,194,126,0.7)" />
                <circle cx="178" cy="100" r="2" fill="rgba(255,255,255,0.5)" />
                <circle cx="22" cy="100" r="1.8" fill="rgba(232,194,126,0.45)" />
                <circle cx="100" cy="192" r="1.5" fill="rgba(255,255,255,0.35)" />
                <circle cx="155" cy="36" r="1.5" fill="rgba(255,255,255,0.4)" />
                <circle cx="45" cy="164" r="1.5" fill="rgba(232,194,126,0.35)" />
              </svg>
              <span className="v3-start-label">开始测试</span>
            </button>
            <p className="v3-hint">请在一个安静的地方 · 完整地给自己5分钟</p>
          </section>
        </div>
      </div>
    </div>
  );
}
