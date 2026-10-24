import { useSession } from "./session";
export const words = {
  together: ["함께 달리고,\n함께 쉬어요.", "Drive together.\nStop together."],
  welcomeDetail: [
    "차마다 다른 필요를, 하나의 경유지로.",
    "Different needs. One shared stop.",
  ],
  start: ["시작하기", "Get started"],
  create: ["새 여정", "New trip"],
  join: ["코드로 참여", "Join with code"],
  demo: ["데모로 둘러보기", "Explore demo"],
  journey: ["여정", "Journey"],
  settings: ["설정", "Settings"],
  group: ["함께하는 차", "Your convoy"],
  invite: ["초대하기", "Invite"],
  needs: ["내 차의 필요", "My needs"],
  stops: ["함께 쉴 곳", "A stop for everyone"],
  recommend: ["경유지 찾기", "Find a stop"],
  charge: ["충전", "Charge"],
  fuel: ["주유", "Fuel"],
  food: ["식사", "Food"],
  rest: ["휴식", "Rest"],
  toilet: ["화장실", "Restroom"],
  manual: ["직접 입력", "Manual"],
  demoLabel: ["데모 데이터", "Demo data"],
  unavailable: ["차량 데이터 없음", "No vehicle data"],
  save: ["저장", "Save"],
  cancel: ["취소", "Cancel"],
  close: ["닫기", "Close"],
  retry: ["다시 연결", "Reconnect"],
  back: ["뒤로", "Back"],
  offline: ["연결 대기 · 변경할 수 없어요", "Offline · changes unavailable"],
  stale: [
    "이전 정보예요. 연결 후 확인해 주세요.",
    "Saved data. Reconnect to verify.",
  ],
  live: ["그룹 연결됨", "Group connected"],
  connecting: ["연결 중", "Connecting"],
  noTrip: ["다음 여정은\n함께 떠나요.", "Make the next trip\na shared one."],
  route: ["서울 → 강릉", "Seoul → Gangneung"],
  routeNote: [
    "현재 서울–강릉 구간을 지원해요.",
    "Seoul–Gangneung corridor supported.",
  ],
  name: ["차 이름", "Car name"],
  destination: ["목적지", "Destination"],
  vehicle: ["차량", "Vehicle"],
  ev: ["전기차", "Electric"],
  ice: ["내연기관", "Fuel"],
  code: ["초대 코드", "Invite code"],
  createAction: ["여정 만들기", "Create trip"],
  joinAction: ["참여하기", "Join trip"],
  suggest: ["이곳 제안하기", "Propose this stop"],
  alternatives: ["다른 경유지", "Alternatives"],
  approve: ["좋아요", "Approve"],
  reject: ["다른 곳으로", "Choose another"],
  voting: ["함께 확인해요", "Awaiting decisions"],
  agreed: ["여기서 만나요.", "Meet here."],
  rejected: ["다른 곳을 골라볼까요?", "Let’s find another stop."],
  maps: ["Apple 지도 열기", "Open Apple Maps"],
  mapsNote: [
    "지도를 여는 요청만 확인해요. 안내 시작은 지도에서 확인해 주세요.",
    "We can confirm only the open request. Check guidance in Maps.",
  ],
  arrive: ["도착했어요", "I have arrived"],
  arrived: ["도착 완료", "Arrived"],
  finish: ["여정 마치기", "Finish trip"],
  finished: ["잘 쉬었나요?", "A good stop, together."],
  completeNote: [
    "모두 함께 도착했어요.\n다음 길도 함께해요.",
    "Everyone has arrived.\nSee you on the next journey.",
  ],
  home: ["다음 여정으로", "Back to home"],
  waiting: ["동행의 응답을 기다려요", "Waiting for your convoy"],
  needsHint: [
    "원하는 것을 고르세요. 꼭 필요하면 필수로 지정해요.",
    "Choose your needs. Mark essentials as required.",
  ],
  required: ["필수", "Required"],
  preferred: ["선호", "Preferred"],
  detour: ["추가 이동 허용", "Extra travel limit"],
  accessible: ["접근성 시설 필수", "Accessible facilities required"],
  energy: ["잔량", "Energy level"],
  noEnergy: ["모름", "Unknown"],
  threshold: ["이하일 때 충전·주유 필요", "or lower triggers an energy stop"],
  seed: [
    "예시 경유지 · 서비스와 시간은 미검증",
    "Example stops · services and times unverified",
  ],
  seedDetail: [
    "실시간 영업·충전 현황이 아니에요. 출발 전 확인해 주세요.",
    "Availability and opening hours are unverified. Check before traveling.",
  ],
  noMatch: ["조건에 맞는 경유지가 없어요", "No stop meets every requirement"],
  noMatchHint: [
    "필수 항목, 충전 규격 또는 추가 이동 한도를 조정해 주세요.",
    "Review essentials, connector and extra travel limit.",
  ],
  companion: ["동행을 초대해 주세요", "Invite another car"],
  companionHint: [
    "두 대 이상 모이면 함께 쉴 곳을 찾을 수 있어요.",
    "Recommendations start with two cars.",
  ],
  leave: ["여정 나가기", "Leave trip"],
  language: ["언어", "Language"],
  appearance: ["화면", "Appearance"],
  system: ["시스템", "System"],
  dark: ["다크", "Dark"],
  light: ["라이트", "Light"],
  about: ["이 앱에 대해", "About ConvoyStop"],
  aboutText: [
    "독립 여행 도우미입니다. Kia·Hyundai 공식 앱이 아니며 차량에 연결하지 않아요. Pleos 연동은 향후 Android Automotive 별도 개발이 필요해요.",
    "Independent trip companion. Not an official Kia or Hyundai app. No vehicle connection. Pleos requires a separate future Android Automotive integration.",
  ],
  dataNote: [
    "입력 잔량은 주행 가능 거리가 아니에요.",
    "Energy percentage does not predict driving range.",
  ],
  demoHint: [
    "가상 동행이 같은 서버에서 응답해요.",
    "A simulated companion responds through the same server.",
  ],
  demoApprove: ["데모 동행 승인", "Demo car approves"],
  demoReject: ["데모 동행 거절", "Demo car declines"],
  demoArrive: ["데모 동행 도착", "Demo car arrives"],
  voteDone: ["응답을 보냈어요", "Decision sent"],
  next: ["계속", "Continue"],
  expired: ["종료되었거나 만료된 여정이에요", "This trip has ended or expired"],
  connection: ["서버 연결", "Server connection"],
  serverAddress: ["서버 주소", "Server URL"],
  apply: ["적용", "Apply"],
  serverHint: [
    "실제 기기는 같은 네트워크의 서버 주소를 입력하세요.",
    "For a real device, enter your server address on the same network.",
  ],
  pendingMaps: ["지도 열기 확인 필요", "Map request incomplete"],
  mapOpened: ["지도 열기 요청됨", "Maps open requested"],
  failedMaps: ["지도를 열지 못했어요", "Could not open Maps"],
  unsaved: ["변경한 내용을 버릴까요?", "Discard your changes?"],
  discard: ["버리기", "Discard"],
  stay: ["계속 편집", "Keep editing"],
} as const;
export type Word = keyof typeof words;
export function translate(key: Word, language: "ko" | "en") {
  return words[key]?.[language === "ko" ? 0 : 1] ?? words[key]?.[1] ?? key;
}
export function useT() {
  const l = useSession((s) => s.language);
  return (key: Word) => translate(key, l);
}
const errors: Record<string, [string, string]> = {
  GROUP_NOT_FOUND: [
    "여정을 찾을 수 없어요. 코드를 확인해 주세요.",
    "Trip not found. Check the invite code.",
  ],
  GROUP_FULL: [
    "이미 여섯 대가 함께하고 있어요.",
    "This convoy already has six cars.",
  ],
  VALIDATION: ["입력한 내용을 확인해 주세요.", "Check the entered values."],
  TRIP_ENDED: [
    "종료되었거나 만료된 여정이에요.",
    "This trip has ended or expired.",
  ],
  TRIP_LOCKED: [
    "이미 경유지가 정해졌어요.",
    "The stop has already been agreed.",
  ],
  STALE_PROPOSAL: [
    "제안이 바뀌었어요. 새 제안을 확인해 주세요.",
    "The proposal changed. Review the latest one.",
  ],
  STALE_TRIP: [
    "그룹 정보가 바뀌었어요. 확인 후 다시 시도해 주세요.",
    "The group changed. Review and try again.",
  ],
  VOTING_CLOSED: ["이미 응답이 마감되었어요.", "Voting has closed."],
  NO_MATCH: ["조건에 맞는 경유지가 없어요.", "No stop meets the requirements."],
  NEED_COMPANION: [
    "동행 차량을 먼저 초대해 주세요.",
    "Invite another car first.",
  ],
  UNAUTHORIZED: [
    "이 기기의 여정 권한을 확인할 수 없어요.",
    "This device could not access the trip.",
  ],
  NOT_MEMBER: [
    "더 이상 참여 중인 여정이 아니에요.",
    "You are no longer a member.",
  ],
  NETWORK: [
    "서버에 연결할 수 없어요. 네트워크와 서버 주소를 확인해 주세요.",
    "Cannot reach the server. Check the network and server address.",
  ],
  WAITING_ARRIVALS: [
    "모든 차량이 도착하면 마칠 수 있어요.",
    "Wait until every car has arrived.",
  ],
  RATE_LIMIT: ["잠시 후 다시 시도해 주세요.", "Please try again shortly."],
};
export function errorText(error: unknown, lang: "ko" | "en") {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  return (
    errors[code]?.[lang === "ko" ? 0 : 1] ??
    (lang === "ko"
      ? "요청을 완료하지 못했어요. 다시 시도해 주세요."
      : "Could not complete the request. Please retry.")
  );
}
