#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

[[circuit]] void shift(
    [[private_input]] uint64_t value,
    [[private_input]] uint64_t shift,
    [[private_input]] uint64_t expected_shifted
) {
    // uint64_t value = 1;
    // uint64_t shift = 1;
    // uint64_t expected_shifted = 2;
    uint64_t shifted = value << shift;
    __builtin_assigner_exit_check(shifted == expected_shifted);
}