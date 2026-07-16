CREATE INDEX "Product_active_category_name_idx"
ON "Product"("active", "category", "name");

CREATE INDEX "Product_name_idx" ON "Product"("name");

CREATE INDEX "PriceHistory_productId_recordedAt_idx"
ON "PriceHistory"("productId", "recordedAt");

CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderEvent_orderId_createdAt_idx"
ON "OrderEvent"("orderId", "createdAt");

CREATE INDEX "ImportRun_startedAt_idx" ON "ImportRun"("startedAt");

CREATE INDEX "AuditEvent_entity_entityId_createdAt_idx"
ON "AuditEvent"("entity", "entityId", "createdAt");
