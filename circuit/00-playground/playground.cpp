#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

[[circuit]] void shift(
    uint64_t value,
    uint64_t shift,
    uint64_t expected_shifted
) {
    uint64_t shifted = value << shift;
    __builtin_assigner_exit_check(shifted == expected_shifted);
}