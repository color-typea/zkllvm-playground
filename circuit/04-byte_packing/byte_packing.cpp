#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

using namespace nil::crypto3;

using hash_type = hashes::sha2<256>;
using block_type = hash_type::block_type;
using field_type = algebra::curves::pallas::base_field_type;

constexpr bool BYTE_ORDER_MSB = true;
constexpr bool BYTE_ORDER_LSB = false;

bool is_same(block_type block0, block_type block1){
    return block0[0] == block1[0] && block0[1] == block1[1];
}

block_type pack_4xuint64_into_block_type(uint64_t e1, uint64_t e2, uint64_t e3, uint64_t e4) {
    std::array<typename field_type::value_type, 128> decomposed_block_1;
    std::array<typename field_type::value_type, 128> decomposed_block_2;

    __builtin_assigner_bit_decomposition(decomposed_block_1.data()     , 64, e1, BYTE_ORDER_LSB);
    __builtin_assigner_bit_decomposition(decomposed_block_1.data() + 64, 64, e2, BYTE_ORDER_LSB);
    __builtin_assigner_bit_decomposition(decomposed_block_2.data()     , 64, e3, BYTE_ORDER_LSB);
    __builtin_assigner_bit_decomposition(decomposed_block_2.data() + 64, 64, e4, BYTE_ORDER_LSB);

    return  {
        __builtin_assigner_bit_composition(decomposed_block_1.data(), 128, BYTE_ORDER_LSB), 
        __builtin_assigner_bit_composition(decomposed_block_2.data(), 128, BYTE_ORDER_LSB)
    };
}

[[circuit]] void pack_uint64s(
    [[private_input]] uint64_t a,
    [[private_input]] uint64_t b,
    [[private_input]] uint64_t c,
    [[private_input]] uint64_t d,
    [[private_input]] block_type expected_block
) {
    block_type packed = pack_4xuint64_into_block_type(a, b, c, d);
    __builtin_assigner_exit_check(is_same(packed, expected_block));
}