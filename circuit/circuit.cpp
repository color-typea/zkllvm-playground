#include <cstdint>

[[circuit]] bool add([[private]] uint32_t a, [[private]] uint32_t b, uint32_t result) {
    bool equal = a + b == result;
    __builtin_assigner_exit_check(equal);
    return equal;
}
