package auth

import (
	"errors"

	"github.com/golang-jwt/jwt/v5"
)

// ParseUserID validates an HS256 JWT and returns the numeric user id from the "id" claim (same shape as core-api).
func ParseUserID(tokenString string, secret string) (int64, error) {
	if tokenString == "" || secret == "" {
		return 0, errors.New("missing token or secret")
	}
	tok, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !tok.Valid {
		return 0, err
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid claims")
	}
	raw, ok := claims["id"]
	if !ok {
		return 0, errors.New("missing id claim")
	}
	switch v := raw.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	default:
		return 0, errors.New("invalid id claim")
	}
}
