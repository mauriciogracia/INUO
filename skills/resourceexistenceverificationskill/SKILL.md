# Skill: ResourceExistenceVerificationSkill
Category: api_integration
Learned: 2026-08-15T04:43:21.783Z (Version: 00.03.70)
Formula: `NEED = (Verify) + (ResourceExistence)`

## Description
Verifies the existence and availability of a specified target resource, entity, identifier, or endpoint across network systems.

## Environment Variables
- `VERIFICATION_API_KEY`

## Sample Payload
```json
{
  "identifier": "https://example.com/api/v1/resource/123",
  "type": "URL",
  "options": {
    "followRedirects": true,
    "timeoutMs": 5000
  }
}
```