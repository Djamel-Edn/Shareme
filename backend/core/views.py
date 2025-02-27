import json
from rest_framework import status
from django.conf import settings
from .models import Pin, CustomUser, Board
from core.serializers import PinSerializer, BoardSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from google.auth.transport.requests import Request
from google.oauth2.id_token import verify_oauth2_token
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Pin, Board
from .serializers import PinSerializer, BoardSerializer
from django.db.models.functions import Upper
class PopularPinsView(APIView):
    def get(self, request):
        try:
            pins = Pin.objects.order_by('-created_at')[:25]
            boards = Board.objects.all()[:25]
            pin_serializer = PinSerializer(pins, many=True)
            board_serializer = BoardSerializer(boards, many=True)
            

            response_data = {
                "pins": pin_serializer.data,
                "boards": board_serializer.data
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            id_token = request.data.get('id_token')
            if not id_token:
                return Response({"error": "Access token is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                id_info = verify_oauth2_token(id_token, Request(), settings.GOOGLE_CLIENT_ID)
            except ValueError as e:
                print("Error Verifying Token:", str(e))
                return Response({"error": str(e)}, status=400)
            except Exception as e:
                print("Unexpected Error:", str(e))
                return Response({"error": "Unexpected error during token verification"}, status=500)

            if id_info['aud'] != settings.GOOGLE_CLIENT_ID:
                raise ValueError('Could not verify the Google OAuth token')

            google_email = id_info['email']
            google_first_name = id_info.get('given_name', '')
            google_last_name = id_info.get('family_name', '')
            google_picture = id_info.get('picture', '')

            user = CustomUser.objects.filter(email=google_email).first()

            if not user:
                user = CustomUser.objects.create(
                    email=google_email,
                    first_name=google_first_name,
                    last_name=google_last_name,
                    profile_picture=google_picture,
                    username=google_email,
                    is_active=True,
                )

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,  
                    'email': user.email,
                    'username': user.username,
                    'profile_picture': user.profile_picture,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
permission_classes = [IsAuthenticated]
def get_user_profile(request, user_id):
    
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=user_id)

            boards = Board.objects.filter(user=user)
            boards_data = BoardSerializer(boards, many=True).data

            pins = Pin.objects.filter(creator=user)
            pins_data = PinSerializer(pins, many=True).data

            data = {
                'id': user.id,
                'username': user.username,
                'profile_picture': user.profile_picture,
                'background_picture': user.background_picture,
                'pins': pins_data,
                'boards': boards_data,
            }

            return JsonResponse(data)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)

def get_username_profile(request, username):
    
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(username=username)

            boards = Board.objects.filter(user=user)
            boards_data = BoardSerializer(boards, many=True).data

            pins = Pin.objects.filter(creator=user)
            pins_data = PinSerializer(pins, many=True).data

            data = {
                'id': user.id,
                'username': user.username,
                'profile_picture': user.profile_picture,
                'background_picture': user.background_picture,
                'pins': pins_data,
                'boards': boards_data,
            }

            return JsonResponse(data)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
        
permission_classes = [IsAuthenticated]
def update_user_profile(request, user_id):
    
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    
    try:
     
        user = CustomUser.objects.filter(id=user_id).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        try:
            data = json.loads(request.body.decode('utf-8'))
          
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

        profile_image_url = data.get('profile_picture')
        background_image_url = data.get('background_picture')

        response_data = {'status': 'success'}

        if profile_image_url:
            user.profile_picture = profile_image_url
            response_data['profile_picture'] = profile_image_url

        if background_image_url:
            user.background_picture = background_image_url
            response_data['background_picture'] = background_image_url
       
        user.save()
        return JsonResponse(response_data, status=200)

    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
        
def create_or_update_pin(request, pin_id=None):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            creator = CustomUser.objects.get(id=data['creator'])

            pin = Pin.objects.create(
                title=data['title'],
                image=data['image'],
                description=data['description'],
                category=data['category'],
                creator=creator,
            )
            return JsonResponse({'id': pin.id, 'status': 'success'})
        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'Creator not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'PUT' and pin_id:
        try:
            pin = Pin.objects.get(id=pin_id)
            data = json.loads(request.body)
          
            pin.title = data.get('title', pin.title)
            pin.image = data.get('image', pin.image)
            pin.description = data.get('description', pin.description)
            pin.category = data.get('category', pin.category)
            pin.save()
          
            return JsonResponse({'status': 'success'})
        except Pin.DoesNotExist:
            return JsonResponse({'error': 'Pin not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE' and pin_id:
        try:
            pin = Pin.objects.get(id=pin_id)
            pin.delete()
            return JsonResponse({'status': 'success'})
        except Pin.DoesNotExist:
            return JsonResponse({'error': 'Pin not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    else:
        return JsonResponse({'error': 'Invalid request method or missing pin_id'}, status=400)
        
def create_or_update_board(request, board_id=None):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            board = Board.objects.create(
                name=data['name'],
                user_id=data['user']
            )
          
            if 'pins' in data:
                pins = Pin.objects.filter(id__in=data['pins'])
                board.pins.set(pins)
            return JsonResponse({'id': board.id, 'status': 'success'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'PUT' and board_id:
        try:
            board = get_object_or_404(Board, id=board_id)
            data = json.loads(request.body)
            board.name = data.get('name', board.name)
            board.save()
            # Update pins for the board
            if 'pins' in data:
                pins = Pin.objects.filter(id__in=data['pins'])
                board.pins.set(pins)
            return JsonResponse({'status': 'success'})
        except Board.DoesNotExist:
            return JsonResponse({'error': 'Board not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE' and board_id:
        try:
            board = get_object_or_404(Board, id=board_id)
            board.delete()
            return JsonResponse({'status': 'success'})
        except Board.DoesNotExist:
            return JsonResponse({'error': 'Board not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method or missing board_id'}, status=400)
        
def add_pin_to_board(request, board_id):
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            pin_id = data.get('pinId')

            if not pin_id:
                return JsonResponse({'error': 'Pin ID is required'}, status=400)

            board = get_object_or_404(Board, id=board_id)
            pin = get_object_or_404(Pin, id=pin_id)

            if pin not in board.pins.all():
                board.pins.add(pin)
                board.save()

            return JsonResponse({'status': 'success'})

        except Board.DoesNotExist:
            return JsonResponse({'error': 'Board not found'}, status=404)
        except Pin.DoesNotExist:
            return JsonResponse({'error': 'Pin not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)

class PinsByCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        category = request.query_params.get('category')
        if not category:
            return Response({"error": "Category parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pins = Pin.objects.filter(category__iexact=category)
            pin_serializer = PinSerializer(pins, many=True)
            return Response(pin_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SearchView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        query = request.query_params.get('query')

        if not query:
            return Response({"error": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pins = Pin.objects.filter(Q(title__icontains=query) | Q(description__icontains=query))
            boards = Board.objects.filter(name__icontains=query)
            pin_serializer = PinSerializer(pins, many=True)
            board_serializer = BoardSerializer(boards, many=True)

            response_data = {
                "pins": pin_serializer.data,
                "boards": board_serializer.data
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class PinDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, pin_id):
        try:
            pin = get_object_or_404(Pin, id=pin_id)
            serializer = PinSerializer(pin)
           
            related_pins = Pin.objects.filter(Q(category=pin.category) & ~Q(id=pin.id))[:10]
            related_serializer = PinSerializer(related_pins, many=True)

            random_pins = list(Pin.objects.exclude(id=pin.id))
            random.shuffle(random_pins)
            random_serializer = PinSerializer(random_pins[:10], many=True)

            response_data = {
                "pin": serializer.data,
                "related_pins": related_serializer.data,
                "random_pins": random_serializer.data
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)