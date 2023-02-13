import { cannotBookingError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import roomRepository from "@/repositories/room-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { resourceUsage } from "process";

async function getBooking(userId: number){
    const booking = await bookingRepository.findByUserId(userId)

    if(!booking) {
        throw notFoundError();
    }

    return booking
}

async function checkEnrollmentTicket(userId: number){
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

    if(!enrollment){
        throw cannotBookingError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

    if(!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel){
        throw cannotBookingError();
    }
}

async function checkValidBooking(roomId: number){
    const room = await roomRepository.findRoomById(roomId);
    const bookings = await bookingRepository.findRoomById(roomId);

    if(!room){
        throw notFoundError();
    }

    if(room.capacity <= bookings.length){
        throw cannotBookingError();
    }
}

async function postBookingRoom(userId: number, roomId: number){
    await checkEnrollmentTicket(userId);
    await checkValidBooking(roomId);

    return bookingRepository.createBooking(userId, roomId)
}

const bookingService = {
    getBooking,
    postBookingRoom,
};


export default bookingService;