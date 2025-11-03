```
cmd + shift + v : 미리보기
```

# Use Case Diagrams

## 1. 시스템 (Cron/Queue)

```mermaid
graph LR
    System[시스템<br/>Cron/Queue]

    UC12[인기 상품 통계 갱신]
    UC14[쿠폰 발급 처리]
    UC15[장바구니 자동 삭제]
    UC16[사용된 쿠폰 삭제]

    System --> UC12
    System --> UC14
    System --> UC15
    System --> UC16

    style System fill:#e3f2fd
```

## 2. 관리자

```mermaid
graph LR
    Admin[관리자]

    UC8[상품 관리]
    UC9[재고 관리]
    UC10[쿠폰 생성]
    UC11[프로모션 관리]
    UC17[비즈니스 인증 승인]
    UC18[주문 상태 관리]

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC17
    Admin --> UC18

    style Admin fill:#f3e5f5
```

## 3. 소매 고객 (B2C)

```mermaid
graph LR
    B2C[소매 고객<br/>B2C]

    UC1[상품 조회<br/>B2C 가격]
    UC2[장바구니 관리]
    UC3[주문 생성]
    UC4[결제 처리]
    UC5[쿠폰 발급 요청]
    UC6[쿠폰 사용]
    UC7[포인트 충전]
    UC19[주문 내역 조회]

    B2C --> UC1
    B2C --> UC2
    B2C --> UC3
    B2C --> UC4
    B2C --> UC5
    B2C --> UC6
    B2C --> UC7
    B2C --> UC19

    UC3 -.-> UC1
    UC4 -.-> UC3
    UC4 -.-> UC6

    style B2C fill:#e8f5e9
```

## 4. 도매 고객 (B2B)

### 4-1. 비즈니스 인증 대기 중

```mermaid
graph LR
    PENDING_B2B[도매 고객<br/>B2B 인증 대기]

    UC13[비즈니스 인증 신청]
    UC20[인증 상태 조회]
    UC21[일반 상품 조회<br/>B2C 가격]

    PENDING_B2B --> UC13
    PENDING_B2B --> UC20
    PENDING_B2B --> UC21

    style PENDING_B2B fill:#fff3cd
```

### 4-2. 비즈니스 인증 완료

```mermaid
graph LR
    B2B[도매 고객<br/>B2B 인증 완료]

    UC1[상품 조회<br/>B2B 가격]
    UC2[장바구니 관리]
    UC3[주문 생성<br/>프로모션 적용]
    UC4[결제 처리]
    UC5[쿠폰 발급 요청]
    UC6[쿠폰 사용]
    UC7[포인트 충전]
    UC19[주문 내역 조회]

    B2B --> UC1
    B2B --> UC2
    B2B --> UC3
    B2B --> UC4
    B2B --> UC5
    B2B --> UC6
    B2B --> UC7
    B2B --> UC19

    UC3 -.-> UC1
    UC4 -.-> UC3
    UC4 -.-> UC6

    style B2B fill:#d4edda
```

# Sequence Diagrams

## 1. 쿠폰 선착순 발급 (작업 큐 기반)

### 1-1. 성공 케이스

```mermaid
sequenceDiagram
    actor User as 사용자
    participant API as API Server
    participant Queue as BullMQ Queue
    participant Redis as Redis
    participant DB as MySQL
    participant Worker as Queue Worker

    User->>API: POST /coupons/{id}/issue
    API->>Redis: GET coupon:{id}:issued_quantity
    Redis-->>API: 현재 발급 수량 (예: 80/100)

    Note over API: 발급 가능 확인

    API->>Queue: 쿠폰 발급 작업 추가
    Queue-->>API: Job ID 반환
    API-->>User: 202 Accepted<br/>{jobId: "abc123"}

    Queue->>Worker: 작업 처리 시작
    Worker->>Redis: INCR coupon:{id}:issued_quantity
    Redis-->>Worker: 81 (증가 후 값)

    Note over Worker: 81 <= 100 (정상)

    Worker->>DB: BEGIN TRANSACTION
    Worker->>DB: INSERT INTO user_coupons<br/>(user_id, coupon_id, status, issued_at)
    Worker->>DB: UPDATE coupons<br/>SET issued_quantity = 81
    Worker->>DB: COMMIT

    Worker->>Redis: SET job:{jobId}:status "success"
    Worker->>User: 알림/이메일 (쿠폰 발급 완료)
```

### 1-2. 실패 케이스

```mermaid
sequenceDiagram
    actor User as 사용자
    participant API as API Server
    participant Redis as Redis

    User->>API: POST /coupons/{id}/issue
    API->>Redis: GET coupon:{id}:issued_quantity
    Redis-->>API: 현재 발급 수량 (100/100)

    Note over API: 이미 수량 소진

    API-->>User: 409 Conflict<br/>{message: "쿠폰이 모두 소진되었습니다"}
```

## 2. 장바구니 조회 (웹/앱 동기화)

### 2-1. 저장된 장바구니가 있는 경우

```mermaid
sequenceDiagram
    actor User as 사용자
    participant WebApp as Web/App
    participant API as API Server
    participant Redis as Redis Cache
    participant DB as MySQL

    User->>WebApp: 장바구니 페이지 접속
    WebApp->>API: GET /cart (JWT)
    API->>API: JWT 검증 및 user_id 추출

    API->>Redis: GET cart:user:{userId}
    Redis-->>API: 장바구니 데이터<br/>[{productId: "p1", quantity: 2},<br/>{productId: "p2", quantity: 1}]

    Note over API: 상품 정보 조회 필요

    API->>DB: SELECT * FROM products<br/>WHERE id IN ('p1', 'p2')
    DB-->>API: 상품 상세 정보<br/>(이름, 가격, 이미지)

    API->>DB: SELECT * FROM product_stock<br/>WHERE product_id IN ('p1', 'p2')
    DB-->>API: 재고 정보

    Note over API: 가격/재고 검증 및 데이터 병합

    API-->>WebApp: 200 OK<br/>[{<br/>  productId: "p1",<br/>  name: "상품1",<br/>  price: 10000,<br/>  quantity: 2,<br/>  stock: 50,<br/>  available: true<br/>}]

    WebApp-->>User: 장바구니 화면 표시
```

### 2-2. 저장된 장바구니가 없는 경우

```mermaid
sequenceDiagram
    actor User as 사용자
    participant WebApp as Web/App
    participant API as API Server
    participant Redis as Redis Cache

    User->>WebApp: 장바구니 페이지 접속
    WebApp->>API: GET /cart (JWT)
    API->>API: JWT 검증 및 user_id 추출

    API->>Redis: GET cart:user:{userId}
    Redis-->>API: null (데이터 없음)

    Note over API: 빈 장바구니

    API-->>WebApp: 200 OK<br/>{items: [], total: 0}

    WebApp-->>User: "장바구니가 비어있습니다" 표시
```

### 2-3. 장바구니에 상품 추가

```mermaid
sequenceDiagram
    actor User as 사용자
    participant API as API Server
    participant Redis as Redis Hash
    participant DB as MySQL

    User->>API: POST /cart/items<br/>{productId: "p1", quantity: 2}
    API->>API: JWT 검증

    API->>DB: SELECT * FROM products WHERE id = 'p1'
    DB-->>API: 상품 존재

    API->>DB: SELECT quantity FROM product_stock<br/>WHERE product_id = 'p1'
    DB-->>API: 재고: 50

    Note over API: 재고 충분 (50 >= 2)

    API->>Redis: HGET cart:user:123 p1
    Redis-->>API: null (없음)

    API->>Redis: HSET cart:user:123 p1 2
    Redis-->>API: 1 (새로 추가됨)

    API->>Redis: EXPIRE cart:user:123 2592000
    Redis-->>API: 1

    API-->>User: 201 Created<br/>{message: "장바구니에 추가되었습니다"}
```

### 2-4. 수량 변경

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Front as 프론트엔드
    participant API as API Server
    participant Redis as Redis Hash
    participant DB as MySQL

    User->>Front: 수량 변경 (7 입력)
    Note over Front: 로컬 상태 업데이트<br/>디바운싱 1초 대기...

    Front->>API: PATCH /cart/items/p1<br/>{quantity: 7}
    API->>API: JWT 검증 및 user_id 추출

    API->>DB: SELECT quantity FROM product_stock<br/>WHERE product_id = 'p1'
    DB-->>API: 재고 수량

    API->>API: 재고 검증 로직

    API->>Redis: HSET cart:user:123 p1 7
    Redis-->>API: 0 (덮어쓰기 완료)

    API-->>Front: 200 OK<br/>{productId: "p1", quantity: 7}

    Front-->>User: UI 확정
```

#### 2-4-1. 재고 검증 로직 flow

```mermaid
flowchart LR
    Start([수량 변경 요청]) --> GetStock[DB: 재고 조회]
    GetStock --> CheckProduct{상품 존재?}

    CheckProduct -->|No| NotFound[404 Not Found<br/>상품을 찾을 수 없습니다]
    CheckProduct -->|Yes| CheckStock{재고 충분?<br/>stock >= quantity}

    CheckStock -->|No| StockError[400 Bad Request<br/>재고 부족<br/>availableStock 반환]
    CheckStock -->|Yes| UpdateRedis[Redis: HSET 덮어쓰기]

    UpdateRedis --> RefreshTTL[Redis: EXPIRE 갱신<br/>30일]
    RefreshTTL --> Success[200 OK<br/>quantity 반환]

    style NotFound fill:#f8d7da
    style StockError fill:#fff3cd
    style Success fill:#d4edda
```

### 2-5. 상품 삭제

```mermaid
sequenceDiagram
    actor User as 사용자
    participant API as API Server
    participant Redis as Redis Hash

    User->>API: DELETE /cart/items/p1
    API->>API: JWT 검증

    API->>Redis: HDEL cart:user:123 p1
    Redis-->>API: 1 (삭제됨)

    API-->>User: 204 No Content
```

## 3. 주문 과정 Flow

```mermaid
flowchart LR
    A[상품 선택] --> B[장바구니 추가]
    B --> C[주문 요청]
    C --> D{재고 확인}
    D -->|충분| E[쿠폰/포인트 적용]
    D -->|부족| F[부분 주문 처리]
    E --> G[결제 처리]
    F --> G
    G --> H[재고 차감]
    H --> I[주문 완료]
    I --> J[장바구니 비우기]
```

## 4. 쿠폰 발급 Flow

```mermaid
flowchart LR
    A[쿠폰 발급 요청] --> B[작업 큐 추가]
    B --> C[202 Accepted]
    C --> D[Worker 처리]
    D --> E{수량 확인}
    E -->|가능| F[쿠폰 발급]
    E -->|소진| G[발급 실패]
    F --> H[사용자에게 알림]
```

## 5. 결제 처리 Flow

```mermaid
flowchart LR
    A[결제 요청] --> B{포인트 충분?}
    B -->|Yes| C[트랜잭션 시작]
    B -->|No| D[결제 실패]
    C --> E[주문 생성]
    E --> F[쿠폰 사용 처리]
    F --> G[포인트 차감]
    G --> H[재고 차감]
    H --> I[커밋]
    I --> J[결제 완료]
```
