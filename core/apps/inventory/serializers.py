"""Inventory serializers."""
from rest_framework import serializers

from .models import Category, Product, Stock, StockMovement, Unit, Warehouse


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'parent', 'created_at']


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'abbreviation']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_abbr = serializers.CharField(source='unit.abbreviation', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'description', 'category', 'category_name',
            'unit', 'unit_abbr', 'cost_price', 'selling_price', 'reorder_level',
            'status', 'image', 'created_at',
        ]


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location', 'is_active', 'created_at']


class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = Stock
        fields = ['id', 'product', 'product_name', 'warehouse', 'warehouse_name', 'quantity', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'warehouse', 'movement_type', 'quantity',
            'reference', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
