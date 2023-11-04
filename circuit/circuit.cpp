#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>

using namespace nil::crypto3;

[[circuit]] void add(std::array<uint64_t, 1024> elements, uint64_t expectedSum) {
    uint64_t sum = 0;
    const size_t chunk_size = 64;

    
        // #pragma zk_multi_prover 0 {
            for (
                size_t idx = chunk_size * 0;
                idx < chunk_size * 1; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 1 {
            for (
                size_t idx = chunk_size * 1;
                idx < chunk_size * 2; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 2 {
            for (
                size_t idx = chunk_size * 2;
                idx < chunk_size * 3; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 3 {
            for (
                size_t idx = chunk_size * 3;
                idx < chunk_size * 4; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 4 {
            for (
                size_t idx = chunk_size * 4;
                idx < chunk_size * 5; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 5 {
            for (
                size_t idx = chunk_size * 5;
                idx < chunk_size * 6; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 6 {
            for (
                size_t idx = chunk_size * 6;
                idx < chunk_size * 7; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 7 {
            for (
                size_t idx = chunk_size * 7;
                idx < chunk_size * 8; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 8 {
            for (
                size_t idx = chunk_size * 8;
                idx < chunk_size * 9; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 9 {
            for (
                size_t idx = chunk_size * 9;
                idx < chunk_size * 10; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 10 {
            for (
                size_t idx = chunk_size * 10;
                idx < chunk_size * 11; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 11 {
            for (
                size_t idx = chunk_size * 11;
                idx < chunk_size * 12; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 12 {
            for (
                size_t idx = chunk_size * 12;
                idx < chunk_size * 13; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 13 {
            for (
                size_t idx = chunk_size * 13;
                idx < chunk_size * 14; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 14 {
            for (
                size_t idx = chunk_size * 14;
                idx < chunk_size * 15; 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    
        // #pragma zk_multi_prover 15 {
            for (
                size_t idx = chunk_size * 15;
                idx < elements.size(); 
                idx++
            ) {
                sum += elements[idx];
            }    
        // }
    

    bool equal = sum == expectedSum;
    __builtin_assigner_exit_check(equal);
}
