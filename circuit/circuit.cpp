#include <cstdint>

[[circuit]] bool add([[private]] uint32_t a, [[private]] uint32_t b, uint32_t result) {
    return a + b == result;
}
