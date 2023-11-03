#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>

using namespace nil::crypto3;

// using hash_type = hashes::sha2<256>;
// using block_type = hash_type::block_type;
// using field_type = algebra::curves::pallas::base_field_type;

// bool is_same(block_type block0, block_type block1){
//     return block0[0] == block1[0] && block0[1] == block1[1];
// }

// typedef __zkllvm_field_pallas_base __attribute__((ext_vector_type(64))) decomposed_int64_type;

// block_type pack(uint64_t a, uint64_t b, uint64_t c, uint64_t d) {
//     int variant = 2;

//     bool deco_msb = (variant & 1) != 0;
//     bool comp_msb = (variant & 2) != 0;
//     bool flip_field = (variant & 4) != 0;
//     bool flip_block = (variant & 8) != 0;

//     decomposed_int64_type a_bits = __builtin_assigner_bit_decomposition64(a, deco_msb);
//     decomposed_int64_type b_bits = __builtin_assigner_bit_decomposition64(b, deco_msb);
//     decomposed_int64_type c_bits = __builtin_assigner_bit_decomposition64(c, deco_msb);
//     decomposed_int64_type d_bits = __builtin_assigner_bit_decomposition64(d, deco_msb);

//     typename field_type::value_type field1;
//     typename field_type::value_type field2;

//     if (!flip_field) {
//         field1 = __builtin_assigner_bit_composition128(a_bits, b_bits, comp_msb);
//         field2 = __builtin_assigner_bit_composition128(c_bits, d_bits, comp_msb);
//     } else {
//         field1 = __builtin_assigner_bit_composition128(b_bits, a_bits, comp_msb);
//         field2 = __builtin_assigner_bit_composition128(d_bits, c_bits, comp_msb);
//     }

//     if (!flip_block) {
//         return {field1, field2};
//     } else {
//         return {field2, field1};
//     }
// }

// [[circuit]] void pack() {
//     uint64_t a = 1;
//     uint64_t b = 2;
//     uint64_t c = 3;
//     uint64_t d = 4;
//     block_type expected_packed = { 0x80000000000000004000000000000000_cppui255, 0xc0000000000000002000000000000000_cppui255 };
//     block_type actual_packed = pack(a, b, c, d);
//     bool equal = is_same(actual_packed, expected_packed);
//     __builtin_assigner_exit_check(equal);
// }

// [[circuit]] void check_hash() {
//     block_type a = { 0x01000000000000000000000000000000_cppui255, 0x00000000000000000000000000000000_cppui255 };
//     block_type b = { 0x02000000000000000000000000000000_cppui255, 0x00000000000000000000000000000000_cppui255 };
//     block_type hashed = { 0xff55c97976a840b4ced964ed49e37945_cppui255, 0x94ba3f675238b5fd25d282b60f70a194_cppui255 };
//     block_type actual_hash = hash<hash_type>(a, b);
//     bool equal = is_same(actual_hash, hashed);
//     __builtin_assigner_exit_check(equal);
// }

[[circuit]] void add(uint64_t a, uint64_t b, uint64_t sum) {
    bool equal = a + b == sum;
    __builtin_assigner_exit_check(equal);
}

