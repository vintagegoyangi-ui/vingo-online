import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import styled from 'styled-components';

// --- Styled Components ---

const CardContainer = styled.div`
  perspective: 1500px; /* 3D 효과를 위한 원근감 */
  width: 320px;
  height: 480px;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none; /* 모바일 스크롤 간섭 방지 */
`;

const CardInner = styled(motion.div)`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d; /* 자식 요소들의 3D 배치 허용 */
`;

const CardFace = styled(motion.div)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* 뒤집혔을 때 뒷면이 보이게 설정 */
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;

const CardFront = styled(CardFace)`
  z-index: 2;
  background: #222;
`;

const CardBack = styled(CardFace)`
  transform: rotateY(180deg); /* 180도 회전시켜 뒷면 배치 */
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 4px solid #c5a47e;
  z-index: 1;
`;

// 프리즘 효과 레이어
const PrismLayer = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  mix-blend-mode: soft-light; /* 너무 촌스럽지 않게 부드럽게 합성 */
  opacity: var(--prism-opacity);
  background: linear-gradient(
    var(--prism-angle),
    rgba(255, 0, 0, 0.2) 0%,
    rgba(255, 255, 0, 0.2) 20%,
    rgba(0, 255, 0, 0.2) 40%,
    rgba(0, 255, 255, 0.2) 60%,
    rgba(0, 0, 255, 0.2) 80%,
    rgba(255, 0, 255, 0.2) 100%
  );
  background-size: 200% 200%;
`;

// --- Main Component ---

const RenderCard = ({ cardData }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 마우스/터치 위치 추적용 Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 1. 틸트(기울기) 계산: 마우스 위치에 따라 -45도 ~ 45도 회전
  // 회전 범위를 크게 하여 뒷면까지 볼 수 있도록 세팅
  const rotateX = useSpring(useTransform(y, [-200, 200], [50, -50]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-200, 200], [-50, 50]), { stiffness: 200, damping: 25 });

  // 2. 프리즘 연동 로직
  // 기울기(rotateY, rotateX) 값에 따라 프리즘의 각도와 위치 변경
  const prismAngle = useTransform([rotateX, rotateY], ([rX, rY]) => `${(rX + rY) * 2}deg`);
  const prismPosX = useTransform(x, [-200, 200], ["0%", "100%"]);
  const prismPosY = useTransform(y, [-200, 200], ["0%", "100%"]);

  // 3. 360도 회전(Flip) 핸들러
  // 클릭 시 180도씩 추가 회전
  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <CardContainer>
      <CardInner
        style={{ 
          rotateX, 
          rotateY: useSpring(useTransform(x, [-200, 200], [isFlipped ? 130 : -50, isFlipped ? 230 : 50])),
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDrag={(event, info) => {
          x.set(info.offset.x);
          y.set(info.offset.y);
        }}
        onDragEnd={() => {
          x.set(0);
          y.set(0);
        }}
        onClick={handleFlip}
      >
        {/* 카드 앞면 */}
        <CardFront>
          <img 
            src={cardData?.image || "https://via.placeholder.com/320x480"} 
            alt="Card Front" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          
          {/* 등급이 SSR 이상일 때만 동적 프리즘 적용 */}
          {cardData?.grade === 'SSR' && (
            <PrismLayer 
              style={{ 
                '--prism-angle': prismAngle,
                '--prism-opacity': 0.6,
                backgroundPositionX: prismPosX,
                backgroundPositionY: prismPosY
              }} 
            />
          )}
        </CardFront>

        {/* 카드 뒷면 */}
        <CardBack>
          <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
            <h3 style={{ color: '#c5a47e' }}>CARD INFO</h3>
            <hr style={{ width: '80%', margin: '10px 0', border: '0.5px solid #555' }} />
            <p>{cardData?.description || "카드의 상세 정보가 이곳에 표시됩니다."}</p>
            <div style={{ marginTop: '50px', fontSize: '2rem' }}>💎</div>
          </div>
        </CardBack>
      </CardInner>
    </CardContainer>
  );
};

export default RenderCard;
