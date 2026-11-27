# ART CLASS PLAYER

아이패드 기반 오프라인 우선 미술교육 이미지 플레이어 (개발 중)

> ART 0A: React + TypeScript + Vite 초기 구조 및 기술 검토. 아직 수업에 사용할 수 있는 플레이어 기능은 구현되지 않았습니다.

## 목표

청운면·단월면 미술반의 크로키·인물화·정물화 수업에서 사진을 일정한 간격으로 자동 넘기고, 강사가 일시정지·시간 연장·건너뛰기를 할 수 있는 수업용 도구입니다. iPad를 빔프로젝터에 연결하여 사용할 수 있도록 설계합니다.

## 실행

Node.js 22 권장:

```bash
npm install
npm run dev
npm run build
```

로컬 개발 주소는 Vite 터미널에 표시됩니다.

## 기술 및 배포

- React, TypeScript, Vite
- GitHub Pages 배포 대상 경로: `/art-class-player/` (아직 배포 설정 전)
- 추후 PWA와 IndexedDB를 단계적으로 도입
- 사용자 이미지와 수업 기록은 GitHub에 올리지 않음
- iPad Safari, 홈 화면 앱 및 외부 출력은 실제 기기 검증 필요

## 문서

- [개발 규칙](AGENTS.md)
- [개발 로드맵과 기술 위험](ROADMAP.md)

## 현재 상태

- ART 0A 초기 스캐폴드 완료
- 자동 빌드 검증: GitHub Actions 결과 확인 필요
- ART 1A (사진 가져오기, 시간 지정, 자동 전환)는 다음 개발 단계
