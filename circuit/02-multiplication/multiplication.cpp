#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>

using namespace nil::crypto3;

[[circuit]] void multiplication(uint64_t a, uint64_t b, uint64_t mul) {
    bool equal = a * b == mul;
    __builtin_assigner_exit_check(equal);
}

