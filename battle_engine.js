/**
 * BattleEngine: 스테이지별 가변 AI(상/중/하)가 탑재된 핵심 로직
 */
const BattleEngine = {
    // 1. 인접 칸 및 비교 스탯 인덱스 계산 [0:상, 1:하, 2:좌, 3:우]
    getNeighbors(idx) {
        const x = idx % 3;
        const y = Math.floor(idx / 3);
        const res = [];
        
        if (y > 0) res.push({ pos: idx - 3, atkStat: 0, defStat: 1 }); // 위쪽 공격
        if (y < 2) res.push({ pos: idx + 3, atkStat: 1, defStat: 0 }); // 아래쪽 공격
        if (x > 0) res.push({ pos: idx - 1, atkStat: 2, defStat: 3 }); // 왼쪽 공격
        if (x < 2) res.push({ pos: idx + 1, atkStat: 3, defStat: 2 }); // 오른쪽 공격
        
        return res;
    },

    // 2. 카드 배치 시 주변 카드 뒤집기 판정
    processTurn(grid, placedIdx) {
        const attacker = grid[placedIdx];
        if (!attacker || !attacker.stats) return [];

        const neighbors = this.getNeighbors(placedIdx);
        const flippedIndices = [];

        neighbors.forEach(n => {
            const defender = grid[n.pos];
            // 상대방 카드인 경우에만 비교
            if (defender && defender.owner !== attacker.owner) {
                const atkValue = Number(attacker.stats[n.atkStat]);
                const defValue = Number(defender.stats[n.defStat]);

                if (atkValue > defValue) {
                    defender.owner = attacker.owner; // 소유권 변경
                    flippedIndices.push(n.pos);
                }
            }
        });

        return flippedIndices;
    },

    /**
     * 3. [상/중/하 통합] AI 최적 수 찾기
     * @param {Array} grid - 현재 게임판 상황
     * @param {Array} enemyHand - 적이 들고 있는 카드 목록
     * @param {Number} stage - 현재 스테이지 (난이도 결정 인자)
     */
    getBestMove(grid, enemyHand, stage = 1) {
        const emptySlots = grid
            .map((val, idx) => (val === null ? idx : null))
            .filter(idx => idx !== null);
            
        if (emptySlots.length === 0 || enemyHand.length === 0) return null;

        // --- 난이도 구간 설정 ---
        let difficulty = 'easy';   // 1~3 스테이지: 하급 (랜덤)
        if (stage >= 4 && stage <= 7) difficulty = 'normal'; // 4~7 스테이지: 중급 (계산+실수)
        if (stage >= 8) difficulty = 'hard';   // 8~10 스테이지: 상급 (완벽 계산)

        // [난이도: 하] - 무조건 랜덤하게 배치
        if (difficulty === 'easy') {
            return {
                targetSlot: emptySlots[Math.floor(Math.random() * emptySlots.length)],
                handIdx: Math.floor(Math.random() * enemyHand.length)
            };
        }

        // --- [난이도: 중/상] 최적의 수 계산 시뮬레이션 ---
        let bestMove = null;
        let maxScore = -1;
        const cornerSlots = [0, 2, 6, 8];

        enemyHand.forEach((card, handIdx) => {
            emptySlots.forEach(slotIdx => {
                let currentScore = 0;
                const neighbors = this.getNeighbors(slotIdx);

                neighbors.forEach(n => {
                    const defender = grid[n.pos];
                    if (defender && defender.owner === 'player') {
                        const atkValue = Number(card.stats[n.atkStat]);
                        const defValue = Number(defender.stats[n.defStat]);
                        if (atkValue > defValue) {
                            currentScore += 1.0; // 뒤집을 수 있는 카드당 1점
                        }
                    }
                });

                // [난이도: 상] 구석 자리 선점 가중치 (방어에 유리)
                if (difficulty === 'hard' && cornerSlots.includes(slotIdx)) {
                    currentScore += 0.2; 
                }

                if (currentScore > maxScore) {
                    maxScore = currentScore;
                    bestMove = { targetSlot: slotIdx, handIdx: handIdx };
                }
            });
        });

        // [난이도: 중] 최선의 수가 있어도 30% 확률로 삐끗함(랜덤 수 발생)
        if (difficulty === 'normal' && Math.random() < 0.3) {
            return {
                targetSlot: emptySlots[Math.floor(Math.random() * emptySlots.length)],
                handIdx: Math.floor(Math.random() * enemyHand.length)
            };
        }

        // 결과 반환 (찾은 수가 없으면 안전하게 첫 번째 빈자리 반환)
        return bestMove || { targetSlot: emptySlots[0], handIdx: 0 };
    },

    // 4. 현재 보드 위의 점수 현황 계산
    getScore(grid) {
        let pCount = 0;
        let eCount = 0;
        grid.forEach(card => {
            if (card) {
                if (card.owner === 'player') pCount++;
                else if (card.owner === 'enemy') eCount++;
            }
        });
        return { player: pCount, enemy: eCount };
    }
};

window.BattleEngine = BattleEngine;
