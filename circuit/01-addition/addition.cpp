#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>

using namespace nil::crypto3;

[[circuit]] void addition([[private]]uint64_t a, uint64_t b, uint64_t sum) {
    bool equal = a + b == sum;
    __builtin_assigner_exit_check(equal);
}

