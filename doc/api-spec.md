# API 명세서

## 1. 인증 (Authentication)

### 1.1 회원가입

- `POST /auth/signup`
- Request Body: email, password, name, phone, address 정보
- Response: 201 Created, 생성된 사용자 정보

### 1.2 로그인

- `POST /auth/login`
- Request Body: email, password
- Response: 200 OK, JWT access token

### 1.3 로그아웃

- `POST /auth/logout`
- Headers: Authorization (JWT)
- Response: 200 OK

---

## 2. 사용자 관리 (Users)

### 2.1 내 정보 조회

- `GET /users/me`
- Headers: Authorization (JWT)
- Response: 사용자 정보 (비즈니스 인증 상태 포함)

### 2.2 내 정보 수정

- `PATCH /users/me`
- Headers: Authorization (JWT)
- Request Body: name, phone, address 등
- Response: 수정된 사용자 정보

### 2.3 회원 탈퇴

- `DELETE /users/me`
- Headers: Authorization (JWT)
- Response: 204 No Content

---

## 3. 비즈니스 인증 (Business)

### 3.1 비즈니스 인증 신청

- `POST /business/verification`
- Headers: Authorization (JWT)
- Request Body: business_number, business_name, image (사업자등록증)
- Response: 201 Created

### 3.2 비즈니스 인증 상태 조회

- `GET /business/verification/status`
- Headers: Authorization (JWT)
- Response: verified 여부, 승인 일시

### 3.3 비즈니스 인증 승인 (관리자)

- `PATCH /admin/business/:business_id/approve`
- Headers: Authorization (Admin JWT)
- Response: 200 OK

---

## 4. 카테고리 (Categories)

### 4.1 카테고리 목록 조회

- `GET /categories`
- Query: active (boolean, optional)
- Response: 카테고리 목록

### 4.2 카테고리 생성 (관리자)

- `POST /admin/categories`
- Request Body: name, active
- Response: 201 Created

---

## 5. 상품 (Products)

### 5.1 상품 목록 조회

- `GET /products`
- Query: category_id, page, limit, sort
- Headers: Authorization (JWT, optional)
- Response: 상품 목록 (B2B 인증 시 B2B 가격, 아니면 B2C 가격)

### 5.2 상품 상세 조회

- `GET /products/:product_id`
- Headers: Authorization (JWT, optional)
- Response: 상품 상세 정보, 재고 수량, (B2B 인증 시 B2B 가격, 아니면 B2C 가격), (B2B 인증 시 프로모션 정보)

### 5.3 상품 생성 (관리자)

- `POST /admin/products`
- Request Body: name, category_id, b2b_price, b2c_price, description, image_url, initial_stock
- Response: 201 Created

### 5.4 상품 수정 (관리자)

- `PATCH /admin/products/:product_id`
- Request Body: 수정할 필드들
- Response: 200 OK

### 5.5 상품 삭제 (관리자)

- `DELETE /admin/products/:productId`
- Response: 204 No Content (Soft Delete)

---

## 6. 재고 관리 (Stock)

### 6.1 재고 조회 (관리자)

- `GET /admin/stock/:product_id`
- Response: 현재 재고 수량, 변경 이력

### 6.2 재고 수정 (관리자)

- `PATCH /admin/stock/:product_id`
- Request Body: quantity (변경할 수량)
- Response: 200 OK

### 6.3 인기 상품 통계 조회

- `GET /products/ranking`
- Query: limit (default: 5)
- Response: 최근 3일간 인기 상품 Top 5

---

## 7. 프로모션 (Promotions)

### 7.1 프로모션 생성 (관리자)

- `POST /admin/promotions`
- Request Body: product_id, paid_quantity, free_quantity
- Response: 201 Created

### 7.2 프로모션 조회 (관리자, B2B)

- `GET /promotions/:product_id`
- Response: 해당 상품의 프로모션 정보

### 7.3 프로모션 삭제 (관리자)

- `DELETE /admin/promotions/:promotion_id`
- Response: 204 No Content

---

## 8. 장바구니 (Cart)

### 8.1 장바구니 조회

- `GET /cart`
- Headers: Authorization (JWT)
- Response: 장바구니 상품 목록 (가격, 재고 포함)

### 8.2 장바구니에 상품 추가

- `POST /cart/items`
- Headers: Authorization (JWT)
- Request Body: product_id, quantity
- Response: 201 Created

### 8.3 장바구니 수량 변경

- `PATCH /cart/items/:product_id`
- Headers: Authorization (JWT)
- Request Body: quantity
- Response: 200 OK

### 8.4 장바구니 상품 삭제

- `DELETE /cart/items/:product_id`
- Headers: Authorization (JWT)
- Response: 204 No Content

### 8.5 장바구니 비우기

- `DELETE /cart`
- Headers: Authorization (JWT)
- Response: 204 No Content

---

## 9. 쿠폰 (Coupons)

### 9.1 쿠폰 목록 조회 (B2C)

- `GET /coupons`
- Query: available (발급 가능 여부)
- Response: 쿠폰 목록

### 9.2 쿠폰 발급 요청 (B2C)

- `POST /coupons/:coupon_id/issue`
- Headers: Authorization (JWT)
- Response: 202 Accepted, job_id 반환

### 9.3 쿠폰 발급 상태 조회 (관리자, B2C)

- `GET /coupons/issue-status/:job_id`
- Headers: Authorization (JWT)
- Response: 발급 진행 상태

### 9.4 내 쿠폰 목록 조회 (관리자, B2C)

- `GET /users/me/coupons`
- Headers: Authorization (JWT)
- Query: status (available, used)
- Response: 보유 쿠폰 목록

### 9.5 쿠폰 생성 (관리자)

- `POST /admin/coupons`
- Request Body: name, discount_rate, max_discount_amount, min_purchase_amount, total_quantity, expired_at
- Response: 201 Created

---

## 10. 지갑 (Wallet)

### 10.1 지갑 잔액 조회

- `GET /wallet/balance`
- Headers: Authorization (JWT)
- Response: 현재 지갑 잔액

### 10.2 지갑 충전

- `POST /wallet/charge`
- Headers: Authorization (JWT)
- Request Body: amount
- Response: 200 OK, 충전 후 잔액

### 10.3 지갑 사용 내역 조회

- `GET /wallet/history`
- Headers: Authorization (JWT)
- Query: page, limit, type (charge, use, refund)
- Response: 지갑 거래 내역

---

## 11. 주문 (Orders)

### 11.1 주문 생성

- `POST /orders`
- Headers: Authorization (JWT)
- Request Body:
  - items: [{ product_id, quantity }]
  - coupon_ids: [쿠폰 ID 배열] (optional)
- Response: 201 Created, 주문 정보 (부분 실패 시 실패한 항목 포함)

### 11.2 주문 목록 조회

- `GET /orders`
- Headers: Authorization (JWT)
- Query: page, limit, status
- Response: 주문 목록

### 11.3 주문 상세 조회

- `GET /orders/:order_id`
- Headers: Authorization (JWT)
- Response: 주문 상세 (주문 항목, 쿠폰, 결제 정보)

### 11.4 주문 취소

- `POST /orders/:order_id/cancel`
- Headers: Authorization (JWT)
- Response: 200 OK (지갑 잔액/쿠폰 복구)

### 11.5 주문 상태 변경 (관리자)

- `PATCH /admin/orders/:order_id/status`
- Request Body: status (processing, shipping, delivered)
- Response: 200 OK

---

## 12. 결제 (Payments)

### 12.1 결제 처리

- `POST /orders/:order_id/payment`
- Headers: Authorization (JWT)
- Request Body: 없음 (지갑 잔액으로만 결제)
- Response: 200 OK, 결제 완료 정보
