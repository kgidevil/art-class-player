# ART CLASS PLAYER — SAI COMPANY

아이패드 중심 미술교육 전용 이미지 플레이어. ART 1A (v0.2) 개발 중 검증.

## 사용 방법
사진 여러 장을 가져오고 30초~20분 프리셋 또는 직접 입력을 선택하여 수업을 시작합니다. 순차/무작위, 자동 전환, 시간 연장, 일시정지, 이전/다음, 원본 비율 유지, 발표 화면을 지원합니다. 사진은 서버에 전송하지 않고 메모리에 보관합니다.

## Windows 개발 및 테스트
Node.js 22:
```powershell
npm install
npm run dev
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```
GitHub Actions에서 Linux 빌드 및 타이머 단위 테스트와 Windows Chromium 브라우저 테스트를 실행합니다.

## 범위
- ART 1A: 기본 플레이어 및 SAI 브랜드 UI.
- 이미지 원본 저장, 오프라인 PWA, 앱 재시작 복구: ART 1B 이후.
- 발표는 미러링용 화면으로 독립 외부 디스플레이가 아닙니다.
- 탭이 숨겨지면 일시정지합니다. 실제 iPad 화면 잠금/외부 출력은 최종 실기기 검증 대상입니다.
- 사용자 사진은 공개 저장소에 등록하지 않습니다.
- 로고 경로: public/sai-logo.jpg (첨부 로고의 240px 축소 JPEG, 원본 해상도 파일은 미등록).
- GitHub Pages는 아직 활성화 확인 전입니다.

[개발 규칙](AGENTS.md) · [로드맵](ROADMAP.md)
