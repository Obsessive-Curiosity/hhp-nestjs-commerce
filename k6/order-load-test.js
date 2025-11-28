import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const orderSuccessCount = new Counter('order_success');
const orderFailCount = new Counter('order_fail');
const stockInsufficientCount = new Counter('stock_insufficient');
const orderDuration = new Trend('order_duration');

// 테스트 설정
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // 워밍업: 10초 동안 10명까지 증가
    { duration: '30s', target: 50 }, // 부하 증가: 30초 동안 50명까지
    { duration: '30s', target: 100 }, // 최대 부하: 30초 동안 100명까지
    { duration: '20s', target: 0 }, // 종료: 20초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95%의 요청이 5초 이내
    http_req_failed: ['rate<0.1'], // HTTP 실패율 10% 미만
    errors: ['rate<0.2'], // 에러율 20% 미만 (재고 부족 포함)
    order_duration: ['avg<2000', 'p(95)<5000'], // 주문 평균 2초, 95% 5초 이내
  },
};

// 환경 변수 (실행 시 변경 가능)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123456';
const NUM_USERS = parseInt(__ENV.NUM_USERS) || 20; // 생성할 RETAILER 계정 수
const WALLET_CHARGE_AMOUNT = parseInt(__ENV.WALLET_CHARGE_AMOUNT) || 1000000; // 각 계정 충전 금액

// 테스트 전 준비 (한 번만 실행)
export function setup() {
  console.log('=== 테스트 준비 중 ===');

  // 1. ADMIN 계정 생성 (이미 존재하면 OK)
  console.log('1. ADMIN 계정 생성 시도...');
  const adminSignupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'Admin User',
      phone: '010-0000-0000',
      role: 'ADMIN',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (adminSignupRes.status === 201) {
    console.log('✅ ADMIN 계정 생성 완료');
  } else {
    console.log('⚠️  ADMIN 계정이 이미 존재 (로그인 시도)');
  }

  // 2. ADMIN 로그인
  console.log('2. ADMIN 로그인 중...');
  const adminLoginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (adminLoginRes.status !== 200 && adminLoginRes.status !== 201) {
    console.error(
      '❌ ADMIN 로그인 실패:',
      adminLoginRes.status,
      adminLoginRes.body,
    );
    throw new Error('ADMIN 로그인 실패');
  }

  const adminLoginData = adminLoginRes.json();
  const adminToken = adminLoginData.accessToken;

  if (!adminToken) {
    console.error('❌ ADMIN 토큰 없음:', adminLoginData);
    throw new Error('ADMIN 토큰을 받지 못했습니다');
  }

  console.log('✅ ADMIN 로그인 성공');

  // 3. 테스트용 상품 생성
  console.log('3. 테스트용 상품 생성 중...');
  const createProductRes = http.post(
    `${BASE_URL}/admin/product`,
    JSON.stringify({
      categoryId: 1,
      name: `[K6 테스트] 테스트 상품 ${Date.now()}`,
      retailPrice: 10,
      wholesalePrice: 5,
      description: 'k6 부하 테스트용 상품입니다.',
      stock: 100000, // 충분한 재고
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
  );

  if (createProductRes.status !== 200 && createProductRes.status !== 201) {
    console.error(
      '❌ 상품 생성 실패:',
      createProductRes.status,
      createProductRes.body,
    );
    throw new Error('상품 생성 실패');
  }

  const productData = createProductRes.json();
  const productId = productData.id;

  if (!productId) {
    console.error('❌ 상품 ID 없음:', productData);
    throw new Error('상품 ID를 받지 못했습니다');
  }

  console.log('✅ 상품 생성 완료:', productId);

  // 4. 여러 RETAILER 계정 생성 및 포인트 충전
  console.log(`\n4. ${NUM_USERS}명의 RETAILER 계정 생성 및 충전 중...`);
  const userTokens = [];

  for (let i = 0; i < NUM_USERS; i++) {
    const userEmail = `k6-retailer-${i}@test.com`;
    const userPassword = 'password123';
    const userName = `K6 Retailer ${i}`;
    const userPhone = `010-${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`;

    // 4-1. RETAILER 계정 생성
    const signupRes = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({
        email: userEmail,
        password: userPassword,
        name: userName,
        phone: userPhone,
        role: 'RETAILER',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    // 계정이 이미 존재해도 OK (400 또는 409)
    if (
      signupRes.status !== 201 &&
      signupRes.status !== 400 &&
      signupRes.status !== 409
    ) {
      console.warn(
        `⚠️  계정 생성 실패 (${userEmail}):`,
        signupRes.status,
        signupRes.body,
      );
      continue;
    }

    // 4-2. RETAILER 로그인
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: userEmail,
        password: userPassword,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.error(
        `❌ 로그인 실패 (${userEmail}):`,
        loginRes.status,
        loginRes.body,
      );
      continue;
    }

    const loginData = loginRes.json();
    const token = loginData.accessToken;

    if (!token) {
      console.error(`❌ 토큰 없음 (${userEmail}):`, loginData);
      continue;
    }

    // 4-3. 포인트 충전
    const chargeRes = http.post(
      `${BASE_URL}/wallet/charge`,
      JSON.stringify({
        amount: WALLET_CHARGE_AMOUNT,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (chargeRes.status !== 200 && chargeRes.status !== 201) {
      console.error(
        `❌ 포인트 충전 실패 (${userEmail}):`,
        chargeRes.status,
        chargeRes.body,
      );
      continue;
    }

    // 4-4. 기본 배송지 추가
    const addressRes = http.post(
      `${BASE_URL}/user/me/address`,
      JSON.stringify({
        zipCode: '12345',
        road: '테스트로 123',
        detail: '테스트 상세주소',
        city: '서울특별시',
        district: '강남구',
        town: '역삼동',
        recipientName: userName,
        phone: userPhone,
        isDefault: true,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (addressRes.status !== 200 && addressRes.status !== 201) {
      console.error(
        `❌ 배송지 추가 실패 (${userEmail}):`,
        addressRes.status,
        addressRes.body,
      );
      continue;
    }

    // 디버깅: 배송지가 제대로 추가되었는지 확인
    if (i === 0) {
      console.log(`[DEBUG] 첫 번째 사용자 배송지 추가 응답:`, addressRes.body);
    }

    userTokens.push(token);

    if ((i + 1) % 5 === 0) {
      console.log(`✅ ${i + 1}/${NUM_USERS}명 완료...`);
    }
  }

  if (userTokens.length === 0) {
    throw new Error('❌ 사용 가능한 RETAILER 계정이 없습니다');
  }

  console.log(`✅ 총 ${userTokens.length}명의 RETAILER 계정 준비 완료`);

  console.log('\n=== 테스트 준비 완료 ===');
  console.log(`상품 ID: ${productId}`);
  console.log(`활성 사용자 수: ${userTokens.length}`);

  return { userTokens, productId };
}

// 각 VU(Virtual User)가 반복 실행
export default function (data) {
  const { userTokens, productId } = data;

  // 각 VU마다 다른 토큰 사용 (라운드 로빈 방식)
  const token = userTokens[__VU % userTokens.length];

  // 주문 요청 시작 시간
  const startTime = Date.now();

  // 주문 생성 및 결제 요청
  const payload = JSON.stringify({
    items: [
      {
        productId: productId,
        quantity: 1,
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: '30s', // 타임아웃 30초 (재시도 고려)
  };

  const response = http.post(`${BASE_URL}/orders/payment`, payload, params);

  // 응답 시간 기록
  const duration = Date.now() - startTime;
  orderDuration.add(duration);

  // 응답 검증
  check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'has order id': (r) => {
      if (r.status === 200 || r.status === 201) {
        try {
          const body = r.json();
          return body.id !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // 재고 부족 등은 정상 케이스
    },
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  // 결과 분류
  if (response.status === 200 || response.status === 201) {
    // 주문 성공
    orderSuccessCount.add(1);
  } else if (response.status === 400) {
    // 재고 부족 등 비즈니스 에러
    const body = response.body;
    if (body.includes('재고') || body.includes('stock')) {
      stockInsufficientCount.add(1);
      // 재고 부족은 예상된 케이스이므로 에러로 카운트 안 함
    } else {
      orderFailCount.add(1);
      errorRate.add(1);
    }
  } else {
    // 서버 에러 등
    orderFailCount.add(1);
    errorRate.add(1);
    console.error(
      `주문 실패 [VU ${__VU}] [${response.status}]:`,
      response.body,
    );
    // 첫 실패 시 더 자세한 정보
    if (orderFailCount.rate === 0) {
      console.error('[DEBUG] 요청 payload:', payload);
      console.error('[DEBUG] 사용 토큰:', token ? '있음' : '없음');
    }
  }

  // 요청 간 간격 (0.5~1.5초 랜덤)
  sleep(Math.random() * 1 + 0.5);
}

// 테스트 종료 후 정리 및 요약
export function teardown() {
  console.log('\n=== 테스트 완료 ===');
  console.log('모든 VU가 종료되었습니다.');
  console.log('\n📊 상세 결과는 위의 메트릭을 확인하세요.');
  console.log('   - order_success: 주문 성공 수');
  console.log('   - order_fail: 주문 실패 수');
  console.log('   - stock_insufficient: 재고 부족 수');
  console.log('   - order_duration: 주문 처리 시간');
}
