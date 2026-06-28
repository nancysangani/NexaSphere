# TODO - Event Stream Processing & Real-Time Analytics (#1776)

- [ ] Create plan + confirm approach (done)
- [ ] Add streaming abstraction layer (Queue interface + implementations)
- [ ] Add outbox dispatcher worker (poll outbox, publish, mark delivered, idempotency)
- [ ] Wire dispatcher into server startup
- [ ] Update eventPublisher to enqueue to outbox before publish (or ensure consistent flow)
- [ ] Ensure tests use MockQueue + mock outbox without DB dependency
- [ ] Expand StreamProcessor windowing/hourly + richer dashboard payload
- [ ] Implement fraud rules (IP/payment) + enforcement
- [ ] Implement real-time recommendation regeneration pipeline
- [ ] Persist processed analytics for historical queries
- [ ] Extend QA tests to cover outbox delivery, ordering, aggregates, anomaly, fraud, recommendations
