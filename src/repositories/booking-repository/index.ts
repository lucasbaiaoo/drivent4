import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function findByUserId(userId: number){
    return prisma.booking.findFirst({
        where: {
            userId,
        },
        include: {
            Room: true
        }
    });
}

async function findRoomById(roomId: number){
    return prisma.booking.findMany({
        where:{
            id: roomId,
        },
        include:{
            Room: true
        }
    });
}

async function createBooking(userId: number, roomId: number) : Promise<Booking> {
  return prisma.booking.create({
    data: {
      roomId,
      userId,
    }
  });
}

async function upsertBooking( roomId: number, userId: number, id: number){
    return prisma.booking.upsert({
        where:{
            id
        },
        create:{
            userId, 
            roomId
        },
        update:{
            roomId
        }
    });
}

const bookingRepository = {
    findByUserId,
    findRoomById,
    createBooking,
    upsertBooking,
};

export default bookingRepository;