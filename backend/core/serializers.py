from rest_framework import serializers
from .models import Pin
from .models import CustomUser
from .models import Board
class CreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'profile_picture']
class PinSerializer(serializers.ModelSerializer):
    creator = CreatorSerializer(read_only=True)  

    class Meta:
        model = Pin
        fields = ['id', 'title', 'image', 'description', 'creator', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name','profile_picture','background_picture'] 
        def create(self, validated_data):
   
            password = validated_data.pop('password')  
            user = CustomUser(**validated_data)  
            user.set_password(password)  
            user.save() 
            return user
        
       
        def update(self, instance, validated_data):
          
            password = validated_data.pop('password', None)  
            for attr, value in validated_data.items():
                setattr(instance, attr, value)  
            if password:
                instance.set_password(password)  
            instance.save() 
            return instance   

class BoardSerializer(serializers.ModelSerializer):
    pins = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = ['id', 'name', 'user', 'pins']

    def get_pins(self, obj):
        """Retrieve pins associated with this board"""
        pins = obj.pins.all()
        return PinSerializer(pins, many=True).data