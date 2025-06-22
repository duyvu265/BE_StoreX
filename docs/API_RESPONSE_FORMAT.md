# API Response Format Documentation

## Tổng quan

Tất cả các API trong hệ thống đều tuân theo format response chuẩn để đảm bảo tính nhất quán và dễ sử dụng cho Frontend.

## Cấu trúc Response Chuẩn

### 1. Response Thành Công (Success Response)

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Dữ liệu trả về
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Response Thành Công với Pagination

```json
{
  "success": true,
  "message": "Success message",
  "data": [
    // Array dữ liệu
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "items_per_page": 10,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Response Lỗi (Error Response)

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Chi tiết lỗi (nếu có)
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Cấu trúc Dữ liệu Sản phẩm (Product)

### Sản phẩm đơn giản (không có variants)

```json
{
  "id": 1,
  "name": "Tên sản phẩm",
  "slug": "ten-san-pham",
  "description": "Mô tả sản phẩm",
  "image_url": "https://example.com/image.jpg",
  "status": "active",
  "is_featured": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",

  "brand": {
    "id": 1,
    "name": "Tên thương hiệu",
    "slug": "ten-thuong-hieu"
  },

  "category": {
    "id": 1,
    "name": "Tên danh mục",
    "slug": "ten-danh-muc"
  },

  "pricing": {
    "base_price": 100000,
    "sale_price": 80000,
    "cost_price": 60000
  },

  "inventory": {
    "quantity": 50,
    "low_stock_threshold": 10
  },

  "identifiers": {
    "sku": "PROD-001",
    "barcode": "1234567890123"
  },

  "metadata": {
    "meta_title": "SEO Title",
    "meta_description": "SEO Description",
    "meta_keywords": "keyword1, keyword2"
  },

  "images": [
    {
      "id": 1,
      "image_url": "https://example.com/image1.jpg",
      "is_main": true
    }
  ],

  "variants": []
}
```

### Sản phẩm có variants

```json
{
  "id": 1,
  "name": "Tên sản phẩm",
  "slug": "ten-san-pham",
  "description": "Mô tả sản phẩm",
  "image_url": "https://example.com/image.jpg",
  "status": "active",
  "is_featured": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",

  "brand": {
    "id": 1,
    "name": "Tên thương hiệu",
    "slug": "ten-thuong-hieu"
  },

  "category": {
    "id": 1,
    "name": "Tên danh mục",
    "slug": "ten-danh-muc"
  },

  "pricing": {
    "base_price": 80000, // Giá thấp nhất trong variants
    "sale_price": 60000, // Giá sale thấp nhất trong variants
    "cost_price": null
  },

  "inventory": {
    "quantity": 150, // Tổng stock của tất cả variants
    "low_stock_threshold": null
  },

  "identifiers": {
    "sku": null, // Không có SKU ở cấp sản phẩm
    "barcode": null
  },

  "metadata": {
    "meta_title": "SEO Title",
    "meta_description": "SEO Description",
    "meta_keywords": "keyword1, keyword2"
  },

  "images": [
    {
      "id": 1,
      "image_url": "https://example.com/image1.jpg",
      "is_main": true
    }
  ],

  "variants": [
    {
      "id": 1,
      "sku": "PROD-001-S",
      "name": "Size S",
      "price": 80000,
      "sale_price": 60000,
      "stock": 50,
      "status": "active",
      "images": [
        {
          "id": 2,
          "image_url": "https://example.com/variant1.jpg",
          "is_main": true
        }
      ]
    },
    {
      "id": 2,
      "sku": "PROD-001-M",
      "name": "Size M",
      "price": 90000,
      "sale_price": 70000,
      "stock": 100,
      "status": "active",
      "images": []
    }
  ]
}
```

## Cấu trúc Dữ liệu Review

```json
{
  "id": 1,
  "product_id": 1,
  "user_id": 1,
  "order_id": 1,
  "rating": 5,
  "title": "Tiêu đề review",
  "content": "Nội dung review",
  "is_verified_purchase": true,
  "is_approved": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",

  "images": [
    {
      "id": 1,
      "image_url": "https://example.com/review1.jpg"
    }
  ],

  "replies": [
    {
      "id": 1,
      "user_id": 2,
      "content": "Nội dung reply",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## HTTP Status Codes

- `200` - OK: Request thành công
- `201` - Created: Tạo mới thành công
- `400` - Bad Request: Dữ liệu đầu vào không hợp lệ
- `401` - Unauthorized: Chưa đăng nhập
- `403` - Forbidden: Không có quyền truy cập
- `404` - Not Found: Không tìm thấy tài nguyên
- `500` - Internal Server Error: Lỗi server

## Lưu ý cho Frontend

1. **Luôn kiểm tra `success` field** trước khi xử lý dữ liệu
2. **Sử dụng `message` field** để hiển thị thông báo cho người dùng
3. **Kiểm tra `pagination`** khi làm việc với danh sách có phân trang
4. **Xử lý `errors` array** để hiển thị lỗi validation
5. **Sử dụng `timestamp`** để debug hoặc cache control
