#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <cstdint>

using namespace nil::crypto3;


uint64_t changeEndianness(uint64_t val) {
    uint64_t result;
    result += ((val >> (0 * 8)) - ((val >> (1 * 8)) << 8)) << (7 * 8);
    result += ((val >> (1 * 8)) - ((val >> (2 * 8)) << 8)) << (6 * 8);
    result += ((val >> (2 * 8)) - ((val >> (3 * 8)) << 8)) << (5 * 8);
    result += ((val >> (3 * 8)) - ((val >> (4 * 8)) << 8)) << (4 * 8);
    result += ((val >> (4 * 8)) - ((val >> (5 * 8)) << 8)) << (3 * 8);
    result += ((val >> (5 * 8)) - ((val >> (6 * 8)) << 8)) << (2 * 8);
    result += ((val >> (6 * 8)) - ((val >> (7 * 8)) << 8)) << (1 * 8);
    result += ((val >> (7 * 8))                          ) << (0 * 8);
    return result;
}

[[circuit]] void pack_uint64s(
    [[private_input]] uint64_t value,
    uint64_t expected
) {
    uint64_t changed = changeEndianness(value);
    __builtin_assigner_exit_check(changed == expected);
}