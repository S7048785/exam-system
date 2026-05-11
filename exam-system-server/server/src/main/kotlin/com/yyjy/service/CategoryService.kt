package com.yyjy.service

import com.yyjy.repository.CategoriesRepository
import org.springframework.stereotype.Service

@Service
class CategoryService(
    private val categoriesRepository: CategoriesRepository
)
