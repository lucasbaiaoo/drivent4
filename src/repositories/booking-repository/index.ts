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

const bookingRepository = {
    findByUserId,
    findRoomById,
    createBooking,
};

export default bookingRepository;