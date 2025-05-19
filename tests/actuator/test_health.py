def test_health_check(client):
    response = client.get("/actuator/health")
    assert response.status_code == 200
    assert response.data == b"OK"