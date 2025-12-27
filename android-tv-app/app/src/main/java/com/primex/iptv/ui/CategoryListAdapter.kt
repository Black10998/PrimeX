package com.primex.iptv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.primex.iptv.R

/**
 * CategoryListAdapter - Left panel category list
 * 
 * Shows:
 * - "All Channels"
 * - Category names
 * - Channel count per category
 */
class CategoryListAdapter(
    private val onCategoryClick: (String) -> Unit
) : ListAdapter<String, CategoryListAdapter.CategoryViewHolder>(CategoryDiffCallback()) {
    
    private var selectedPosition = 0
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category_list, parent, false)
        return CategoryViewHolder(view, onCategoryClick)
    }
    
    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(getItem(position), position == selectedPosition)
    }
    
    fun setSelectedCategory(category: String) {
        val newPosition = currentList.indexOf(category)
        if (newPosition != -1 && newPosition != selectedPosition) {
            val oldPosition = selectedPosition
            selectedPosition = newPosition
            notifyItemChanged(oldPosition)
            notifyItemChanged(newPosition)
        }
    }
    
    inner class CategoryViewHolder(
        itemView: View,
        private val onCategoryClick: (String) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val categoryName: TextView = itemView.findViewById(R.id.category_name)
        
        fun bind(category: String, isSelected: Boolean) {
            categoryName.text = category
            
            itemView.setOnClickListener {
                onCategoryClick(category)
                setSelectedCategory(category)
            }
            
            // Focus handling
            itemView.isFocusable = true
            itemView.isFocusableInTouchMode = true
            
            // Visual feedback for selection
            itemView.isSelected = isSelected
            
            itemView.setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    view.animate()
                        .scaleX(1.05f)
                        .scaleY(1.05f)
                        .setDuration(150)
                        .start()
                } else {
                    view.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(150)
                        .start()
                }
            }
        }
    }
    
    private class CategoryDiffCallback : DiffUtil.ItemCallback<String>() {
        override fun areItemsTheSame(oldItem: String, newItem: String): Boolean {
            return oldItem == newItem
        }
        
        override fun areContentsTheSame(oldItem: String, newItem: String): Boolean {
            return oldItem == newItem
        }
    }
}
