# CMake configuration for native security library
cmake_minimum_required(VERSION 3.18.1)

project("primex_security")

# Create native security library
add_library(
    primex_security
    SHARED
    native_security.cpp
)

# Link against Android logging library
find_library(
    log-lib
    log
)

target_link_libraries(
    primex_security
    ${log-lib}
)
