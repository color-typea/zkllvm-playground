#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>

using namespace nil::crypto3;

[[circuit]] void add(std::array<uint64_t, 256> elements, uint64_t expectedSum) {
    uint64_t sum = 0;
    constexpr size_t chunks = 16;
    const size_t chunk_size = 16;
    std::array<uint64_t, chunks> subresults;


    
        // #pragma zk_multi_prover 0 {
            sum = 0;
            for (
                size_t idx = chunk_size * 0;
                idx < chunk_size * 1; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[0] = sum;
        // }
    
        // #pragma zk_multi_prover 1 {
            sum = 0;
            for (
                size_t idx = chunk_size * 1;
                idx < chunk_size * 2; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[1] = sum;
        // }
    
        // #pragma zk_multi_prover 2 {
            sum = 0;
            for (
                size_t idx = chunk_size * 2;
                idx < chunk_size * 3; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[2] = sum;
        // }
    
        // #pragma zk_multi_prover 3 {
            sum = 0;
            for (
                size_t idx = chunk_size * 3;
                idx < chunk_size * 4; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[3] = sum;
        // }
    
        // #pragma zk_multi_prover 4 {
            sum = 0;
            for (
                size_t idx = chunk_size * 4;
                idx < chunk_size * 5; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[4] = sum;
        // }
    
        // #pragma zk_multi_prover 5 {
            sum = 0;
            for (
                size_t idx = chunk_size * 5;
                idx < chunk_size * 6; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[5] = sum;
        // }
    
        // #pragma zk_multi_prover 6 {
            sum = 0;
            for (
                size_t idx = chunk_size * 6;
                idx < chunk_size * 7; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[6] = sum;
        // }
    
        // #pragma zk_multi_prover 7 {
            sum = 0;
            for (
                size_t idx = chunk_size * 7;
                idx < chunk_size * 8; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[7] = sum;
        // }
    
        // #pragma zk_multi_prover 8 {
            sum = 0;
            for (
                size_t idx = chunk_size * 8;
                idx < chunk_size * 9; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[8] = sum;
        // }
    
        // #pragma zk_multi_prover 9 {
            sum = 0;
            for (
                size_t idx = chunk_size * 9;
                idx < chunk_size * 10; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[9] = sum;
        // }
    
        // #pragma zk_multi_prover 10 {
            sum = 0;
            for (
                size_t idx = chunk_size * 10;
                idx < chunk_size * 11; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[10] = sum;
        // }
    
        // #pragma zk_multi_prover 11 {
            sum = 0;
            for (
                size_t idx = chunk_size * 11;
                idx < chunk_size * 12; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[11] = sum;
        // }
    
        // #pragma zk_multi_prover 12 {
            sum = 0;
            for (
                size_t idx = chunk_size * 12;
                idx < chunk_size * 13; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[12] = sum;
        // }
    
        // #pragma zk_multi_prover 13 {
            sum = 0;
            for (
                size_t idx = chunk_size * 13;
                idx < chunk_size * 14; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[13] = sum;
        // }
    
        // #pragma zk_multi_prover 14 {
            sum = 0;
            for (
                size_t idx = chunk_size * 14;
                idx < chunk_size * 15; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[14] = sum;
        // }
    
        // #pragma zk_multi_prover 15 {
            sum = 0;
            for (
                size_t idx = chunk_size * 15;
                idx < elements.size(); 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[15] = sum;
        // }
    

    uint64_t finalSum = 0;
    for (size_t idx = 0; idx < subresults.size(); idx++) {
        finalSum += subresults[idx];
    }

    bool equal = finalSum == expectedSum;
    __builtin_assigner_exit_check(equal);
}
