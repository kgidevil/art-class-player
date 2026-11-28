# ART CLASS PLAYER — 사용 및 최종 검증 안내
## 1. Windows
PowerShell: `cd D:\codex\art-class-player`, `git pull --ff-only origin main`, `npm install`, `npm run build`, `npm run preview`. Open http://localhost:4173/art-class-player/ in Chrome or Edge. 기존 서버는 Ctrl+C로 종료. 새 버전 적용 버튼을 사용; 흰 화면이면 앱 캐시 복구 또는 서비스 워커만 해제. 사이트 데이터 전체 삭제 금지.
## 2. 배포
https://github.com/kgidevil/art-class-player/settings/pages → Build and deployment → Source → GitHub Actions. Actions → Build and Windows browser tests → Run workflow (main) 또는 최신 실패 배포 재실행. 성공 후 https://kgidevil.github.io/art-class-player/ 접속. HTTPS 및 오프라인 준비 완료 확인. 실제 URL 검증 전 배포 완료로 간주하지 않는다.
## 3. Windows 자료를 iPad로 이동
준비 화면 → 백업 및 복원 열기 → 백업 파일 만들기 → 백업 파일 저장. 확장자 .saibackup 유지. iCloud Drive/USB/개인 파일 전송으로 iPad 파일 앱에 저장 (공개 저장소 금지). iPad Safari에서 배포 HTTPS 주소 → 공유 → 홈 화면에 추가 → 홈 화면 앱을 열고 오프라인 준비 완료 확인. Safari와 홈 화면 앱 저장소가 분리될 수 있으므로 실제 사용할 홈 화면 앱에서 복원. 기존 iPad 데이터가 있으면 먼저 백업. 백업 및 복원 → 백업 파일 선택 → 검증 완료 확인 → 검증한 백업으로 교체 → 확인 → 재실행. 사진 수, 강의실, 설정, 기록 확인. 복원 파일은 원본과 별도로 유지.
## 4. 수업 사용
SAI 제공 수업 자료 → 업데이트 확인/자동 다운로드 선택. 수업 이미지의 자료 범위와 주제 선택. 단일 시간 또는 수업 프로그램 만들기(분, 장수, 휴식). 시작 후 일시정지/다음/+시간. 미술 도구로 명암·격자·반전·확대; 드로잉으로 설명선, 강사 모드로 다음 단계. 발표 화면은 동일 디스플레이 미러링. 설명선은 현재 수업 동안만 유지.
## 5. 실기기 확인 체크리스트
- [ ] iPadOS Safari/홈 화면 앱에서 최초 실행, 사진 및 설정 복원, 사진 수 및 기록 비교.
- [ ] Wi-Fi 끄고 앱 완전 종료/재실행, 사진·수업·명암·드로잉 사용.
- [ ] Apple Pencil 실제 필압, 펜 입력만 설정, 손가락 차단 및 손바닥 오입력 확인. 펜 전용이 하드웨어 손바닥 제거를 보장하지 않음.
- [ ] USB-C HDMI 어댑터/프로젝터 연결, 화면 미러링, 가로/세로와 해상도, 그림 잘림 및 타이머 글자 가독성 확인.
- [ ] 전원 연결, 화면 자동 잠금 방지 및 화면 켜짐 유지 표시 확인. 방해 금지 설정 권장. 테스트 종료 후 자동 잠금 복구.
- [ ] 실제 3시간 수업 또는 동등한 실시간 연속 재생: 시작/종료 시각, 사진 전환 수, 휴식, 일시정지·재개, 확대/드로잉, 화면 잠금/과열/메모리 재시작 여부 기록.
- [ ] 수업 도중 홈 이동/복귀, 앱 종료 후 일시정지 복구, 최종 수업 기록 확인.
- [ ] 수업 종료 후 새 백업 만들고 다른 기기/브라우저에서 검증. 기존 백업 유지.
## 6. 릴리스 판정
모든 실기기 항목을 직접 확인한 뒤 버전/기기/OS/프로젝터/이슈와 함께 개발 기록에 남긴다. Windows CI 또는 가속 타이머 검증만으로 3시간 실기기 안정성을 주장하지 않는다.
